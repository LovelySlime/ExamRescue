import React from 'react';
import type { UserAnswerRecord } from '../types';

interface ProgressBarProps {
  currentIndex: number;
  totalQuestions: number;
  records: UserAnswerRecord[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  totalQuestions,
  records,
}) => {
  const currentNum = Math.min(currentIndex + 1, totalQuestions);
  const percentage = totalQuestions > 0 ? (currentNum / totalQuestions) * 100 : 0;

  const correctCount = records.filter((r) => r.isCorrect).length;
  const incorrectCount = records.filter((r) => !r.isCorrect).length;

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] mb-1.5 font-medium">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">進捗状況:</span>
          <span className="font-mono font-bold text-white">
            {currentNum} <span className="text-slate-500 font-normal">/</span> {totalQuestions} 問
          </span>
          <span className="font-mono text-indigo-400 font-bold">
            ({Math.round(percentage)}%)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[10px] font-bold">
          <span className="text-emerald-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>正解: {correctCount}</span>
          </span>
          <span className="text-rose-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            <span>不正解: {incorrectCount}</span>
          </span>
        </div>
      </div>

      {/* Progress Track & Bar */}
      <div className="max-w-4xl mx-auto h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
