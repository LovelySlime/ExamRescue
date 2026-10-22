import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import type { ExamData } from '../types';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ExamData) => void;
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateAndImport = () => {
    try {
      setError(null);
      if (!jsonText.trim()) {
        setError('JSONテキストを入力してください。');
        return;
      }
      const parsed = JSON.parse(jsonText);
      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        setError('有効な "questions" 配列が見つかりません。');
        return;
      }

      onImport(parsed as ExamData);
      onClose();
    } catch (e: any) {
      setError(`JSONの解析エラー: ${e.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonText(text);
        setError(null);
      } catch (err: any) {
        setError('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">問題JSONの手動読み込み</h3>
              <p className="text-xs text-slate-400">
                JSONテキストを直接貼り付けるか、JSONファイルを選択してください。
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              JSONファイルから読み込む
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              または JSONテキストをペースト
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{\n  "title": "科目名",\n  "questions": [\n    ...\n  ]\n}'
              rows={8}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleValidateAndImport}
            className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            読み込んで適用
          </button>
        </div>
      </div>
    </div>
  );
};
