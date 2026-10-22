import React, { useState, useEffect } from 'react';
import type { ExamResult, UserAnswerRecord, Question } from '../types';
import { 
  Trophy, RotateCcw, Shuffle, CheckCircle2, XCircle, 
  HelpCircle, Copy, Check, Download, Sparkles, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AI_FOLLOWUP_PROMPT_TEMPLATE } from '../utils/promptTemplate';

interface DashboardViewProps {
  result: ExamResult;
  isServerConnected: boolean;
  onRetryIncorrect: (incorrectQuestions: Question[]) => void;
  onRetryHesitated: (hesitatedQuestions: Question[]) => void;
  onRetryAll: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  result,
  isServerConnected,
  onRetryIncorrect,
  onRetryHesitated,
  onRetryAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  useEffect(() => {
    if (result.summary.accuracyRate >= 70) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [result.summary.accuracyRate]);

  const incorrectRecords = result.records.filter((r) => !r.isCorrect);
  const hesitatedRecords = result.records.filter((r) => r.hesitationReason.trim().length > 0);

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

  const handleCopyAiPrompt = () => {
    const jsonStr = JSON.stringify(result, null, 2);
    const prompt = AI_FOLLOWUP_PROMPT_TEMPLATE(jsonStr);
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `results_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="h-full w-full max-w-7xl mx-auto px-4 py-3 flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* 2-Column Layout for Full-Screen No-Scroll Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
        
        {/* Left Column (Score Summary & Action Controls) - 5 Cols */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3 overflow-y-auto pr-1">
          {/* Header Trophy & Title */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-amber-500/30 shrink-0">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">
                  特訓完了！お疲れ様でした
                </h1>
                <p className="text-[11px] text-slate-400 truncate font-medium">
                  {result.title}
                </p>
              </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                <span className="block text-xl font-black text-indigo-400">
                  {Math.round(result.summary.accuracyRate)}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">正答率</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                <span className="block text-xl font-black text-emerald-400">
                  {result.summary.correct}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">正解</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                <span className="block text-xl font-black text-rose-400">
                  {result.summary.incorrect}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">不正解</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                <span className="block text-xl font-black text-amber-400">
                  {result.summary.hesitatedCount}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">迷った問</span>
              </div>
            </div>
          </div>

          {/* Instant Retry Section */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>サイト内で即座に再特訓（AI不要・待ち時間0秒）</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={incorrectRecords.length === 0}
                onClick={() => onRetryIncorrect(getQuestionsFromRecords(incorrectRecords))}
                className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all border ${
                  incorrectRecords.length > 0
                    ? 'bg-rose-600/20 border-rose-500/40 text-rose-200 hover:bg-rose-600/30'
                    : 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>間違えた問題（{incorrectRecords.length}問）</span>
              </button>

              <button
                type="button"
                disabled={hesitatedRecords.length === 0}
                onClick={() => onRetryHesitated(getQuestionsFromRecords(hesitatedRecords))}
                className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all border ${
                  hesitatedRecords.length > 0
                    ? 'bg-amber-600/20 border-amber-500/40 text-amber-200 hover:bg-amber-600/30'
                    : 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>迷った問題（{hesitatedRecords.length}問）</span>
              </button>

              <button
                type="button"
                onClick={onRetryAll}
                className="p-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all border bg-indigo-600/20 border-indigo-500/40 text-indigo-200 hover:bg-indigo-600/30"
              >
                <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                <span>全問シャッフル</span>
              </button>
            </div>
          </div>

          {/* AI Feedback & Export */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-white font-bold text-xs">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>手元AIに直前チートシートを作らせる</span>
              </div>
              {isServerConnected && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ✓ results.json 保存済
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              解答理由や自作語呂合わせを元に、試験会場で直前5分に見るまとめをAIに生成させます。
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyAiPrompt}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow transition-all ${
                  copied
                    ? 'bg-emerald-600'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 active:scale-[0.98]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>プロンプトをコピー！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>AI直前まとめプロンプトをコピー</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                title="結果JSONをダウンロード"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON保存</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Question History List) - 7 Cols, Internal Scroll Only! */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              全問の解答ログ ＆ メモ一覧 ({result.records.length}問)
            </h3>
            <span className="text-[10px] text-slate-500">クリックで詳細展開</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pt-2">
            {result.records.map((record, idx) => {
              const isExpanded = expandedId === record.questionId;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/80 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : record.questionId)}
                    className="w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 pr-2 min-w-0">
                      {record.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-mono text-xs text-slate-500 font-bold shrink-0">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-medium text-white truncate">
                        {record.question}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {record.userMnemonic && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                          語呂メモ
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 space-y-2 text-xs animate-in fade-in duration-150">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 font-semibold block text-[10px]">
                            あなたの解答: {record.userAnswerIndex ? `(${record.userAnswerIndex}番)` : ''}
                          </span>
                          <p className="text-white font-medium text-xs">{record.userAnswer}</p>
                        </div>
                        <div>
                          <span className="text-indigo-400 font-semibold block text-[10px]">
                            模範解答:
                          </span>
                          <p className="text-indigo-200 font-medium text-xs">{record.correctAnswer}</p>
                        </div>
                      </div>

                      {record.presentedOptions && record.presentedOptions.length > 0 && (
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-500 block mb-1">出題時の選択肢対応:</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {record.presentedOptions.map((opt, i) => (
                              <span key={i} className="text-slate-300 font-mono">
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.userReason && (
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                          <span className="font-semibold text-slate-400 mr-2">解答根拠:</span>
                          {record.userReason}
                        </div>
                      )}

                      {record.hesitationReason && (
                        <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-200 text-[11px]">
                          <span className="font-semibold text-amber-400 mr-2">迷い理由:</span>
                          {record.hesitationReason}
                        </div>
                      )}

                      {record.userMnemonic && (
                        <div className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-indigo-200 text-[11px]">
                          <span className="font-semibold text-indigo-400 mr-2">自作語呂:</span>
                          {record.userMnemonic}
                        </div>
                      )}

                      <div className="pt-1 text-slate-400 leading-relaxed border-t border-slate-900 text-[11px]">
                        <span className="text-slate-500 font-semibold block text-[10px]">
                          解説:
                        </span>
                        {record.modelExplanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
