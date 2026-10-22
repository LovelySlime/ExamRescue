import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Sparkles } from 'lucide-react';
import { AGENT_SYSTEM_PROMPT } from '../utils/promptTemplate';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(AGENT_SYSTEM_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">手元AI（ChatGPT / Claude等）用プロンプト</h3>
              <p className="text-xs text-slate-400">
                このプロンプトを資料（レジュメ等）と一緒にAIに投げるだけで、問題JSONが即座に生成されます。
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 leading-relaxed flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">使い方：</span>
              <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-300">
                <li>下の「プロンプトをコピー」ボタンを押す</li>
                <li>ChatGPTやClaude、ローカルAIエージェントに貼り付ける</li>
                <li>続けて学校のレジュメや教科書のテキスト・画像を添付して送信</li>
                <li>
                  出力されたJSONを <code className="text-indigo-300 bg-indigo-950 px-1 py-0.5 rounded">data/questions.json</code> に保存するか、ヘッダーの「JSON読込」に貼り付ける
                </li>
              </ol>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
              {AGENT_SYSTEM_PROMPT}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            ※ 4択問題と用語想起（記述）の両方に対応しています
          </span>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              閉じる
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center space-x-2 px-5 py-2 text-xs font-bold rounded-xl text-white shadow-lg transition-all ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>コピーしました！</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>プロンプトをコピー</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
