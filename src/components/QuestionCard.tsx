import React, { useState, useEffect, useRef } from 'react';
import type { Question } from '../types';
import { HelpCircle, Check, CornerDownLeft, Sparkles, HelpCircle as DontKnowIcon } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onSubmit: (
    userAnswer: string,
    userReason: string,
    hesitationReason: string,
    presentedOptions?: string[],
    userAnswerIndex?: number
  ) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onSubmit,
}) => {
  const [displayOptions, setDisplayOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | undefined>(undefined);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [userReason, setUserReason] = useState<string>('');
  const [hesitationReason, setHesitationReason] = useState<string>('');
  const [showHesitation, setShowHesitation] = useState<boolean>(false);

  const textInputRef = useRef<HTMLInputElement>(null);
  const reasonInputRef = useRef<HTMLInputElement>(null);

  // Initialize and shuffle choices when question changes
  useEffect(() => {
    setSelectedOption('');
    setSelectedOptionIndex(undefined);
    setTextAnswer('');
    setUserReason('');
    setHesitationReason('');
    setShowHesitation(false);

    if (question.type === 'choice' && question.options) {
      // 選択肢の完全ランダムシャッフル
      const shuffled = [...question.options].sort(() => Math.random() - 0.5);
      setDisplayOptions(shuffled);
    } else {
      setDisplayOptions([]);
      if (question.type === 'text') {
        setTimeout(() => textInputRef.current?.focus(), 50);
      }
    }
  }, [question]);

  const handleSelectOption = (option: string, idx: number) => {
    setSelectedOption(option);
    setSelectedOptionIndex(idx + 1);
  };

  const currentAnswer = question.type === 'choice' ? selectedOption : textAnswer;
  const canSubmit = currentAnswer.trim().length > 0;

  const handleSubmit = (overrideAnswer?: string, overrideReason?: string) => {
    const finalAnswer = overrideAnswer !== undefined ? overrideAnswer : currentAnswer;
    const finalReason = overrideReason !== undefined ? overrideReason : userReason;
    if (!finalAnswer.trim()) return;

    // シャッフルされた出題順リストを作成（「1: ○○, 2: △△...」として記録）
    const presented = displayOptions.length > 0
      ? displayOptions.map((opt, i) => `${i + 1}: ${opt}`)
      : undefined;

    onSubmit(
      finalAnswer,
      finalReason,
      hesitationReason,
      presented,
      selectedOptionIndex
    );
  };

  // "わからない" アクション
  const handleGiveUp = () => {
    handleSubmit('わからない', '未習得・ど忘れ');
  };

  // Keyboard shortcut listener for choices (1, 2, 3, 4) and submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName.toLowerCase();
      const isTyping = activeEl === 'input' || activeEl === 'textarea';

      if (!isTyping && question.type === 'choice' && displayOptions.length > 0) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= displayOptions.length) {
          e.preventDefault();
          handleSelectOption(displayOptions[num - 1], num - 1);
          reasonInputRef.current?.focus();
        }
      }

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !isTyping)) {
        if (canSubmit) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, displayOptions, selectedOption, textAnswer, userReason, hesitationReason, canSubmit]);

  return (
    <div className="h-full w-full max-w-3xl mx-auto px-4 flex flex-col justify-center py-2 animate-in fade-in duration-200">
      <div className="space-y-3.5">
        {/* Progress & Badge */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-indigo-400 text-sm">
              Q{currentIndex + 1}
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-mono">{totalQuestions}</span>
          </div>
          <div className="flex items-center space-x-2">
            {question.category && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                {question.category}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${
                question.type === 'choice'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {question.type === 'choice' ? '4択（シャッフル済）' : '記述・用語'}
            </span>
          </div>
        </div>

        {/* Question Card Box */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
            {question.question}
          </h2>

          {/* Answer Selection: シャッフルされた選択肢を表示 */}
          {question.type === 'choice' && displayOptions.length > 0 ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayOptions.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(option, idx)}
                      className={`p-3 rounded-xl text-left text-xs font-medium transition-all flex items-start justify-between border ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/15'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 pr-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded font-mono text-[11px] flex items-center justify-center font-bold shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="whitespace-normal break-words leading-relaxed">
                          {option}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 text-right">
                キーボードの <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px]">1</kbd> ~ <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px]">4</kbd> でも選択可能
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                解答を入力（用語・キーワード）
              </label>
              <input
                ref={textInputRef}
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="正解だと思う用語を入力..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    reasonInputRef.current?.focus();
                  }
                }}
              />
            </div>
          )}

          {/* Metacognition: Reason & Hesitation */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>解答の根拠（なぜこれを選んだか）</span>
                </label>
                <input
                  ref={reasonInputRef}
                  type="text"
                  value={userReason}
                  onChange={(e) => setUserReason(e.target.value)}
                  placeholder="例：2番は〇〇だから消去法で1番..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800/90 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmit) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>

              <div>
                {!showHesitation ? (
                  <div className="h-full flex items-end">
                    <button
                      type="button"
                      onClick={() => setShowHesitation(true)}
                      className="text-xs text-slate-400 hover:text-amber-400 flex items-center space-x-1.5 transition-colors py-2"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>迷ったなら理由も記録（任意）</span>
                    </button>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-amber-400/90 mb-1">
                      迷った理由
                    </label>
                    <input
                      type="text"
                      value={hesitationReason}
                      onChange={(e) => setHesitationReason(e.target.value)}
                      placeholder="例：3番の用語と一瞬混同した..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800/90 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSubmit) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: "わからない" ボタン ＆ "解答して答え合わせ" */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleGiveUp}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all active:scale-[0.98]"
            title="悩まず即座に正解と解説を確認します"
          >
            <DontKnowIcon className="w-3.5 h-3.5" />
            <span>わからない（答えを確認）</span>
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => handleSubmit()}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              canSubmit
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <span>解答して即時答え合わせ</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
