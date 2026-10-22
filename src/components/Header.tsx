import React from 'react';
import { Sparkles, Terminal, FileCode, RotateCcw } from 'lucide-react';

interface HeaderProps {
  examTitle: string;
  isServerConnected: boolean;
  onOpenPromptModal: () => void;
  onOpenImportModal: () => void;
  onResetSession?: () => void;
  inSession?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  examTitle,
  isServerConnected,
  onOpenPromptModal,
  onOpenImportModal,
  onResetSession,
  inSession = false,
}) => {
  return (
    <header className="h-14 shrink-0 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              ExamRescue
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium whitespace-nowrap">
              前夜の駆け込み寺
            </span>
          </div>
          {examTitle && (
            <span className="hidden md:inline text-xs text-slate-500 truncate max-w-sm pl-2 border-l border-slate-800">
              {examTitle}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Server status indicator */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              isServerConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
            title={
              isServerConnected
                ? 'ローカルAPIと接続中（data/questions.json と自動同期）'
                : 'オフラインまたは静的モード'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isServerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isServerConnected ? 'AI Linked' : 'Offline'}</span>
          </div>

          {/* AI Prompt Button */}
          <button
            onClick={onOpenPromptModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-all active:scale-[0.98]"
            title="手元AI用プロンプトを表示"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AIプロンプト</span>
          </button>

          {/* Manual JSON Import Button */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all active:scale-[0.98]"
            title="JSONを直接読み込む"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON読込</span>
          </button>

          {/* Reset session button if in session */}
          {inSession && onResetSession && (
            <button
              onClick={() => {
                if (window.confirm('学習を中断して最初に戻りますか？')) {
                  onResetSession();
                }
              }}
              className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="最初に戻る"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
