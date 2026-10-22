import React, { useState, useEffect, useRef } from 'react';
import type { Question, UserAnswerRecord } from '../types';
import { CheckCircle2, XCircle, CornerDownLeft, BookOpen, Lightbulb } from 'lucide-react';
import { evaluateTextAnswer } from '../utils/matcher';

interface ExplanationCardProps {
  question: Question;
  userAnswer: string;
  userReason: string;
  hesitationReason: string;
  presentedOptions?: string[];
  userAnswerIndex?: number;
  currentIndex: number;
  totalQuestions: number;
  onNext: (record: UserAnswerRecord) => void;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  question,
  userAnswer,
  userReason,
  hesitationReason,
  presentedOptions,
  userAnswerIndex,
  currentIndex,
  totalQuestions,
  onNext,
}) => {
  const isGiveUp = userAnswer === 'わからない';

  const [isCorrect, setIsCorrect] = useState<boolean>(() => {
    if (isGiveUp) return false;
    if (question.type === 'choice') {
      return (
        userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase()
      );
    } else {
      const match = evaluateTextAnswer(
        userAnswer,
        question.answer,
        question.acceptable_answers
      );
      return match.isMatch || match.isClose;
    }
  });

  const isCloseMatch = !isGiveUp && question.type === 'text' && (() => {
    const match = evaluateTextAnswer(
      userAnswer,
      question.answer,
      question.acceptable_answers
    );
    return match.isClose && !match.isMatch;
  })();

  const [userMnemonic, setUserMnemonic] = useState<string>('');
  const mnemonicInputRef = useRef<HTMLInputElement>(null);

  // 【エッジトリガー検知】前の画面で押されたEnterが「一度完全に離された（keyup / not-pressed）」ことを検知するまで、Enterによる進行を一切受け付けない！
  const hasKeyBeenReleasedRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Enterキーが離されたことを検知
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        hasKeyBeenReleasedRef.current = true;
      }
    };

    // 2. Enterキーが押されたことを検知（離された後の新規押下のみ通す）
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // まだ一度もEnterが離されていない場合は、前画面の長押し残りなので完全に無視！
        if (!hasKeyBeenReleasedRef.current) {
          e.preventDefault();
          return;
        }

        const activeEl = document.activeElement?.tagName.toLowerCase();
        const isTyping = activeEl === 'input' || activeEl === 'textarea';

        if (!isTyping || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);

    // 万が一keyupが画面外で発生した場合の安全弁（300ms後に自動解除）
    const fallbackTimer = setTimeout(() => {
      hasKeyBeenReleasedRef.current = true;
    }, 300);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(fallbackTimer);
    };
  }, [isCorrect, userMnemonic, question, userAnswer, userReason, hesitationReason]);

  const handleNext = () => {
    const record: UserAnswerRecord = {
      questionId: question.id,
      question: question.question,
      type: question.type,
      options: question.options,
      presentedOptions,
      userAnswer,
      userAnswerIndex,
      correctAnswer: question.answer,
      isCorrect,
      userReason,
      hesitationReason,
      userMnemonic,
      modelExplanation: question.model_explanation,
      timestamp: new Date().toISOString(),
    };
    onNext(record);
  };

  const isLastQuestion = currentIndex + 1 === totalQuestions;

  return (
    <div className="h-full w-full max-w-3xl mx-auto px-4 flex flex-col justify-center py-2 animate-in fade-in duration-200">
      <div className="space-y-3">
        {/* Top bar with result banner */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            isCorrect
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">
                  {isCorrect ? '正解！' : isGiveUp ? '解説を確認してインプット！' : '不正解（ここで確実に覚え直す！）'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  (Q{currentIndex + 1} / {totalQuestions})
                </span>
              </div>
              {isCloseMatch && isCorrect && (
                <p className="text-[10px] text-emerald-400/90 font-medium">
                  ※ 表記ゆれを自動判定しデフォルト正解（○）として通しました
                </p>
              )}
            </div>
          </div>

          {/* Quick Override Buttons */}
          <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setIsCorrect(true)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                isCorrect ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ○ 正解
            </button>
            <button
              type="button"
              onClick={() => setIsCorrect(false)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                !isCorrect ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              × 不正解
            </button>
          </div>
        </div>

        {/* Comparison & Explanation Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          {/* Question preview */}
          <p className="text-xs font-semibold text-slate-300 line-clamp-2 border-b border-slate-800/80 pb-2">
            {question.question}
          </p>

          {/* Answers Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                あなたの解答 {userAnswerIndex ? `(${userAnswerIndex}番)` : ''}
              </span>
              <p className={`text-xs font-bold whitespace-normal break-words ${isGiveUp ? 'text-amber-400' : 'text-white'}`}>
                {userAnswer}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/40">
              <span className="text-[10px] font-bold text-indigo-400 block mb-0.5">模範正解</span>
              <p className="text-xs font-bold text-indigo-200 whitespace-normal break-words">
                {question.answer}
              </p>
            </div>
          </div>

          {/* 出題時の選択肢対応リスト */}
          {presentedOptions && presentedOptions.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[10px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-slate-500 font-semibold">出題順:</span>
              {presentedOptions.map((opt, i) => (
                <span key={i} className="text-slate-400">
                  {opt}
                </span>
              ))}
            </div>
          )}

          {/* User Reason / Hesitation */}
          {(userReason || hesitationReason) && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              {userReason && (
                <div>
                  <span className="text-slate-500 font-medium mr-1.5">解答理由:</span>
                  <span className="text-slate-300">{userReason}</span>
                </div>
              )}
              {hesitationReason && (
                <div>
                  <span className="text-amber-500 font-medium mr-1.5">迷い理由:</span>
                  <span className="text-amber-300/90">{hesitationReason}</span>
                </div>
              )}
            </div>
          )}

          {/* AI Model Explanation with internal scroll */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-950 to-indigo-950/30 border border-indigo-500/20 space-y-1">
            <div className="flex items-center space-x-1.5 text-indigo-300 font-bold text-[11px]">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI模範解答根拠</span>
            </div>
            <div className="max-h-28 sm:max-h-36 overflow-y-auto pr-1">
              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {question.model_explanation}
              </p>
            </div>
          </div>

          {/* Mnemonic Memo */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <label className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>自分用の覚え方・語呂合わせをメモ（任意）</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                直前チートシートに反映
              </span>
            </label>
            <input
              ref={mnemonicInputRef}
              type="text"
              value={userMnemonic}
              onChange={(e) => setUserMnemonic(e.target.value)}
              placeholder="例：この単語は〇〇とセットで覚える / 語呂：〇〇で一発暗記..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-amber-500/30 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Next Button */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            [Enter] またはボタンクリックで進む
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <span>{isLastQuestion ? '採点・成績へ' : '次の問題へ'}</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
