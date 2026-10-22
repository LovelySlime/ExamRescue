import React from 'react';
import { X, Trash2, RotateCcw, Trophy, Calendar, ArrowRight } from 'lucide-react';
import type { ExamResult, Question, UserAnswerRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExamResult[];
  onRetryIncorrect: (incorrectQuestions: Question[]) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onRetryIncorrect,
  onClearHistory,
}) => {
  if (!isOpen) return null;

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

  const handleRetry = (result: ExamResult) => {
    const incorrect = result.records.filter((r) => !r.isCorrect);
    if (incorrect.length > 0) {
      onRetryIncorrect(getQuestionsFromRecords(incorrect));
      onClose();
    }
  };

  // Format date nicely
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">過去の学習・解答履歴</h3>
              <p className="text-xs text-slate-400">
                直近の特訓記録と各回の正誤推移を確認できます。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-slate-400">学習履歴がまだありません。</p>
              <p className="text-xs text-slate-500">特訓を1回完了すると、ここに推移が記録されます。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((result, idx) => {
                const incorrectRecords = result.records.filter((r) => !r.isCorrect);
                const hasIncorrect = incorrectRecords.length > 0;
                const isLatest = idx === 0;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isLatest
                        ? 'bg-slate-950/80 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                        : 'bg-slate-950/40 border-slate-800/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          #{history.length - idx}回目
                        </span>
                        {isLatest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            最新
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(result.completedAt)}</span>
                        </span>
                      </div>

                      {/* Score metrics */}
                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className="text-indigo-400 font-bold text-sm">
                          {Math.round(result.summary.accuracyRate)}%
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          ○ {result.summary.correct}
                        </span>
                        <span className="text-rose-400 font-semibold">
                          × {result.summary.incorrect}
                        </span>
                      </div>
                    </div>

                    {/* Quick Question Result Pills */}
                    <div className="pt-2.5 pb-2">
                      <div className="flex flex-wrap gap-1">
                        {result.records.map((rec, rIdx) => (
                          <span
                            key={rIdx}
                            className={`w-5 h-5 rounded text-[10px] font-mono flex items-center justify-center font-bold ${
                              rec.isCorrect
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                            title={`Q${rIdx + 1}: ${rec.isCorrect ? '正解' : '不正解'} (${rec.question})`}
                          >
                            {rIdx + 1}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Retry button for this session */}
                    {hasIncorrect && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRetry(result)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 transition-all active:scale-[0.98]"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                          <span>この回の不正解（{incorrectRecords.length}問）を再特訓</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
          {history.length > 0 ? (
            <button
              onClick={() => {
                if (window.confirm('これまでの学習履歴と解答記録を全て削除しますか？')) {
                  onClearHistory();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>全解答記録を削除</span>
            </button>
          ) : (
            <span />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
