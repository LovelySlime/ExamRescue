export type QuestionType = 'choice' | 'text';

export interface Question {
  id: number | string;
  type: QuestionType;
  question: string;
  options?: string[]; // choiceモード時の選択肢（通常4択）
  answer: string; // choice: 正解テキスト or インデックス, text: 模範正解
  acceptable_answers?: string[]; // textモード時の表記ゆれ・別解許容リスト
  model_explanation: string; // 模範根拠（なぜそれが正解か、なぜ他が誤りか）
  category?: string;
}

export interface ExamData {
  title: string;
  questions: Question[];
}

export interface UserAnswerRecord {
  questionId: number | string;
  question: string;
  type: QuestionType;
  options?: string[];
  presentedOptions?: string[]; // 実際に出題されたシャッフル順（例: ["1: 選択肢C", "2: 選択肢A", ...]）
  userAnswer: string;
  userAnswerIndex?: number; // ユーザーが選択した番号 (1, 2, 3, 4)
  correctAnswer: string;
  isCorrect: boolean;
  userReason: string; // なぜこれを選んだかの根拠（「1番は〜だから」等の番号指定も追跡可能）
  hesitationReason: string; // 迷ったなら迷った理由
  userMnemonic: string; // ユーザーが思いついた自分用の覚え方・語呂合わせメモ
  modelExplanation: string;
  timestamp: string;
}

export interface ExamResult {
  title: string;
  completedAt: string;
  summary: {
    total: number;
    correct: number;
    incorrect: number;
    hesitatedCount: number;
    accuracyRate: number; // 0-100
  };
  records: UserAnswerRecord[];
}

export interface InProgressSession {
  examTitle: string;
  activeQuestions: Question[];
  currentIndex: number;
  sessionRecords: UserAnswerRecord[];
  savedAt: string;
}
