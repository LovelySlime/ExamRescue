import React, { useState, useEffect, useCallback } from 'react';
import type { ExamData, Question, UserAnswerRecord, ExamResult, InProgressSession } from './types';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { StartView } from './components/StartView';
import { QuestionCard } from './components/QuestionCard';
import { ExplanationCard } from './components/ExplanationCard';
import { DashboardView } from './components/DashboardView';
import { PromptModal } from './components/PromptModal';
import { JsonImportModal } from './components/JsonImportModal';
import { HistoryModal } from './components/HistoryModal';

const FALLBACK_EXAM_DATA: ExamData = {
  title: 'ExamRescue 直前マスター特訓',
  questions: []
};

const STORAGE_KEY_HISTORY = 'exam_rescue_history';
const STORAGE_KEY_IN_PROGRESS = 'exam_rescue_in_progress';

export const App: React.FC = () => {
  // Application Data & Connection State
  const [examData, setExamData] = useState<ExamData>(FALLBACK_EXAM_DATA);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Active Session State
  const [phase, setPhase] = useState<'start' | 'answering' | 'explanation' | 'dashboard'>('start');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentAnswerDraft, setCurrentAnswerDraft] = useState<{
    userAnswer: string;
    userReason: string;
    hesitationReason: string;
    presentedOptions?: string[];
    userAnswerIndex?: number;
  }>({ userAnswer: '', userReason: '', hesitationReason: '' });

  const [sessionRecords, setSessionRecords] = useState<UserAnswerRecord[]>([]);

  // Interrupted session in progress
  const [inProgressSession, setInProgressSession] = useState<InProgressSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IN_PROGRESS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // History List (Saved sessions)
  const [history, setHistory] = useState<ExamResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [examResult, setExamResult] = useState<ExamResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Load questions and previous results from local API on mount
  const fetchInitialData = useCallback(async () => {
    try {
      // 1. Fetch questions
      const qRes = await fetch('/api/questions');
      if (qRes.ok) {
        const qData = await qRes.json();
        if (qData && Array.isArray(qData.questions) && qData.questions.length > 0) {
          setExamData(qData);
          setIsServerConnected(true);
        }
      }

      // 2. Fetch results if local history is empty
      const rRes = await fetch('/api/results');
      if (rRes.ok) {
        const rData: ExamResult = await rRes.json();
        if (rData && rData.summary && Array.isArray(rData.records)) {
          setExamResult((prev) => prev || rData);
          setHistory((prev) => {
            if (prev.length === 0) {
              try {
                localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([rData]));
              } catch {
                // ignore
              }
              return [rData];
            }
            return prev;
          });
        }
      }
    } catch {
      setIsServerConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Save in-progress state to LocalStorage
  const saveProgress = (questions: Question[], idx: number, records: UserAnswerRecord[]) => {
    if (questions.length === 0) return;
    const progress: InProgressSession = {
      examTitle: examData.title,
      activeQuestions: questions,
      currentIndex: idx,
      sessionRecords: records,
      savedAt: new Date().toISOString(),
    };
    setInProgressSession(progress);
    localStorage.setItem(STORAGE_KEY_IN_PROGRESS, JSON.stringify(progress));
  };

  const clearProgress = () => {
    setInProgressSession(null);
    localStorage.removeItem(STORAGE_KEY_IN_PROGRESS);
  };

  // Save results automatically to /api/results and LocalStorage history
  const saveResultsToApi = async (result: ExamResult) => {
    try {
      clearProgress();
      const updatedHistory = [result, ...history.filter(h => h.completedAt !== result.completedAt)].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));

      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result, null, 2),
      });
      if (res.ok) {
        console.log('Results automatically saved to data/results.json');
      }
    } catch (err) {
      console.warn('Could not post to /api/results (offline mode)', err);
    }
  };

  // Start Exam from beginning
  const handleStart = (shuffle: boolean) => {
    clearProgress();
    let list = [...examData.questions];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    setActiveQuestions(list);
    setCurrentIndex(0);
    setSessionRecords([]);
    setExamResult(null);
    setPhase('answering');
    saveProgress(list, 0, []);
  };

  // Resume interrupted session
  const handleResumeSession = () => {
    if (!inProgressSession) return;
    setActiveQuestions(inProgressSession.activeQuestions);
    setCurrentIndex(inProgressSession.currentIndex);
    setSessionRecords(inProgressSession.sessionRecords);
    setPhase('answering');
  };

  // Discard interrupted session
  const handleDiscardSession = () => {
    if (window.confirm('中断したセッションを破棄しますか？')) {
      clearProgress();
    }
  };

  // Submit Answer -> Move to Instant Explanation Phase
  const handleSubmitAnswer = (
    userAnswer: string,
    userReason: string,
    hesitationReason: string,
    presentedOptions?: string[],
    userAnswerIndex?: number
  ) => {
    setCurrentAnswerDraft({
      userAnswer,
      userReason,
      hesitationReason,
      presentedOptions,
      userAnswerIndex,
    });
    setPhase('explanation');
  };

  // Finish Explanation -> Next Question or Dashboard
  const handleNextQuestion = (record: UserAnswerRecord) => {
    const updatedRecords = [...sessionRecords, record];
    setSessionRecords(updatedRecords);

    if (currentIndex + 1 < activeQuestions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setPhase('answering');
      saveProgress(activeQuestions, nextIdx, updatedRecords);
    } else {
      clearProgress();
      const correctCount = updatedRecords.filter((r) => r.isCorrect).length;
      const totalCount = updatedRecords.length;
      const accuracyRate = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
      const hesitatedCount = updatedRecords.filter(
        (r) => r.hesitationReason.trim().length > 0
      ).length;

      const result: ExamResult = {
        title: examData.title,
        completedAt: new Date().toISOString(),
        summary: {
          total: totalCount,
          correct: correctCount,
          incorrect: totalCount - correctCount,
          hesitatedCount,
          accuracyRate,
        },
        records: updatedRecords,
      };

      setExamResult(result);
      setPhase('dashboard');
      saveResultsToApi(result);
    }
  };

  // Retrying options (間違えた問題のみ)
  const handleRetryIncorrect = (incorrectQuestions: Question[]) => {
    clearProgress();
    setActiveQuestions(incorrectQuestions);
    setCurrentIndex(0);
    setSessionRecords([]);
    setPhase('answering');
    saveProgress(incorrectQuestions, 0, []);
  };

  const handleRetryHesitated = (hesitatedQuestions: Question[]) => {
    clearProgress();
    setActiveQuestions(hesitatedQuestions);
    setCurrentIndex(0);
    setSessionRecords([]);
    setPhase('answering');
    saveProgress(hesitatedQuestions, 0, []);
  };

  const handleRetryAll = () => {
    clearProgress();
    const shuffled = [...examData.questions].sort(() => Math.random() - 0.5);
    setActiveQuestions(shuffled);
    setCurrentIndex(0);
    setSessionRecords([]);
    setPhase('answering');
    saveProgress(shuffled, 0, []);
  };

  const handleResetSession = () => {
    setPhase('start');
    setCurrentIndex(0);
    setSessionRecords([]);
  };

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    clearProgress();
    setHistory([]);
    setExamResult(null);
  };

  const handleImportJson = (newData: ExamData) => {
    setExamData(newData);
    clearProgress();
    handleResetSession();
  };

  const currentQuestion = activeQuestions[currentIndex];
  const latestResult = history.length > 0 ? history[0] : examResult;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        examTitle={examData.title}
        isServerConnected={isServerConnected}
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onResetSession={handleResetSession}
        inSession={phase !== 'start'}
      />

      {(phase === 'answering' || phase === 'explanation') && (
        <ProgressBar
          currentIndex={currentIndex}
          totalQuestions={activeQuestions.length}
          records={sessionRecords}
        />
      )}

      <main className="flex-1 min-h-0 overflow-hidden relative">
        {phase === 'start' && (
          <StartView
            examData={examData}
            isServerConnected={isServerConnected}
            previousResult={latestResult}
            inProgressSession={inProgressSession}
            historyCount={history.length}
            onStart={handleStart}
            onRetryIncorrect={handleRetryIncorrect}
            onResumeSession={handleResumeSession}
            onDiscardSession={handleDiscardSession}
            onOpenPromptModal={() => setIsPromptModalOpen(true)}
            onViewPreviousResult={() => {
              if (latestResult) {
                setExamResult(latestResult);
                setPhase('dashboard');
              }
            }}
            onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
            onClearHistory={handleClearHistory}
          />
        )}

        {phase === 'answering' && currentQuestion && (
          <QuestionCard
            key={`q-${currentQuestion.id}-${currentIndex}`}
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={activeQuestions.length}
            onSubmit={handleSubmitAnswer}
          />
        )}

        {phase === 'explanation' && currentQuestion && (
          <ExplanationCard
            key={`exp-${currentQuestion.id}-${currentIndex}`}
            question={currentQuestion}
            userAnswer={currentAnswerDraft.userAnswer}
            userReason={currentAnswerDraft.userReason}
            hesitationReason={currentAnswerDraft.hesitationReason}
            presentedOptions={currentAnswerDraft.presentedOptions}
            userAnswerIndex={currentAnswerDraft.userAnswerIndex}
            currentIndex={currentIndex}
            totalQuestions={activeQuestions.length}
            onNext={handleNextQuestion}
          />
        )}

        {phase === 'dashboard' && examResult && (
          <DashboardView
            result={examResult}
            isServerConnected={isServerConnected}
            onRetryIncorrect={handleRetryIncorrect}
            onRetryHesitated={handleRetryHesitated}
            onRetryAll={handleRetryAll}
          />
        )}
      </main>

      {/* Modals */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />

      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportJson}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onRetryIncorrect={handleRetryIncorrect}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};

export default App;
