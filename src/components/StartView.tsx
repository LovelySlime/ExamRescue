import React, { useState } from 'react';
import { Play, Shuffle, Zap, Terminal, ArrowRight, Trophy, RotateCcw, History, Trash2, Clock, PlayCircle } from 'lucide-react';
import type { ExamData, ExamResult, Question, UserAnswerRecord, InProgressSession } from '../types';

interface StartViewProps {
  examData: ExamData;
  isServerConnected: boolean;
  previousResult?: ExamResult | null;
  inProgressSession?: InProgressSession | null;
  historyCount: number;
  onStart: (shuffle: boolean) => void;
  onRetryIncorrect: (incorrectQuestions: Question[]) => void;
  onResumeSession?: () => void;
  onDiscardSession?: () => void;
  onOpenPromptModal: () => void;
  onViewPreviousResult?: () => void;
  onOpenHistoryModal: () => void;
  onClearHistory: () => void;
}

export const StartView: React.FC<StartViewProps> = ({
  examData,
  isServerConnected,
  previousResult,
  inProgressSession,
  historyCount,
  onStart,
  onRetryIncorrect,
  onResumeSession,
  onDiscardSession,
  onOpenPromptModal,
  onViewPreviousResult,
  onOpenHistoryModal,
  onClearHistory,
}) => {
  const [shuffle, setShuffle] = useState(false);

  const choiceCount = examData.questions.filter((q) => q.type === 'choice').length;
  const textCount = examData.questions.filter((q) => q.type === 'text').length;

  const getQuestionsFromRecords = (records: UserAnswerRecord[]): Question[] => {
    return records.map((r) => ({
      id: r.questionId,
      type: r.type,
      question: r.question,
      options: r.options,
      answer: r.correctAnswer,
      model_explanation: r.modelExplanation,
    }));
  };

  const incorrectRecords = previousResult ? previousResult.records.filter((r) => !r.isCorrect) : [];
  const hasIncorrect = incorrectRecords.length > 0;

  return (
    <div className="h-full w-full max-w-4xl mx-auto px-4 flex flex-col justify-center items-center py-2 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl space-y-3">
        {/* Hero Badge & Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold">
            <Zap className="w-3 h-3" />
            <span>試験前夜・一夜漬け専用システム</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {examData.title || '試験対策 直前特訓'}
          </h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            「たまたま正解」を排除。解答根拠をアウトプットし、即時模範解説と突き合わせて記憶を上書きするWebアプリです。
          </p>
        </div>

        {/* ⚡ 中断セッション再開バナー（途中離脱・ブラウザ閉じ対策） */}
        {inProgressSession && onResumeSession && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/50 to-slate-900 border border-emerald-500/40 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    中断した特訓があります（Q{inProgressSession.currentIndex + 1} / {inProgressSession.activeQuestions.length}問中）
                  </span>
                  <span className="text-[10px] text-emerald-400/80">
                    回答済 {inProgressSession.sessionRecords.length}問の記録を保持しています
                  </span>
                </div>
              </div>

              {onDiscardSession && (
                <button
                  type="button"
                  onClick={onDiscardSession}
                  className="text-[10px] text-slate-400 hover:text-rose-400 underline transition-colors"
                >
                  破棄
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onResumeSession}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-600/30 transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>前回の途中（Q{inProgressSession.currentIndex + 1}）から再開する</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 🚀 直前の特訓ループ復帰バナー（朝起きて再開した時用） */}
        {previousResult && !inProgressSession && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/50 to-slate-900 border border-indigo-500/30 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    直前の特訓結果：正答率 {Math.round(previousResult.summary.accuracyRate)}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    正解 {previousResult.summary.correct}問 / 不正解 {previousResult.summary.incorrect}問
                  </span>
                </div>
              </div>

              {onViewPreviousResult && (
                <button
                  type="button"
                  onClick={onViewPreviousResult}
                  className="text-[11px] font-semibold text-indigo-300 hover:text-white underline underline-offset-2 transition-colors"
                >
                  詳細成績を見る
                </button>
              )}
            </div>

            {/* トップから直接間違えた問題のループへ突入できるボタン */}
            {hasIncorrect && (
              <button
                type="button"
                onClick={() => onRetryIncorrect(getQuestionsFromRecords(incorrectRecords))}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-md shadow-rose-600/30 transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>直前に間違えた問題（{incorrectRecords.length}問）のみ再特訓する</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Overview & Main Start Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center divide-x divide-slate-800">
            <div>
              <span className="block text-xl sm:text-2xl font-black text-white">{examData.questions.length}</span>
              <span className="text-[11px] text-slate-400 font-medium">総問題数</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black text-indigo-400">{choiceCount}</span>
              <span className="text-[11px] text-slate-400 font-medium">4択問題</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black text-emerald-400">{textCount}</span>
              <span className="text-[11px] text-slate-400 font-medium">用語想起</span>
            </div>
          </div>

          {/* Options */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                <span>出題順序をランダムシャッフルする</span>
              </span>
            </label>

            {isServerConnected && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ✓ data/questions.json 連携中
              </span>
            )}
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={() => onStart(shuffle)}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center space-x-2 group"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>全問特訓を開始する（{examData.questions.length}問）</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenPromptModal}
              className="px-3.5 py-3 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-[0.99] flex items-center justify-center space-x-1.5 shrink-0"
              title="手元AI用プロンプトを確認"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>AIプロンプト</span>
            </button>
          </div>
        </div>

        {/* History and Reset Controls Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <button
            type="button"
            onClick={onOpenHistoryModal}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>過去の特訓履歴（{historyCount}回分）を確認</span>
          </button>

          {historyCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('学習履歴と解答記録を全てリセットしますか？')) {
                  onClearHistory();
                }
              }}
              className="flex items-center space-x-1 text-slate-500 hover:text-rose-400 transition-colors"
              title="記録を消去して初期状態に戻す"
            >
              <Trash2 className="w-3 h-3" />
              <span>記録リセット</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
