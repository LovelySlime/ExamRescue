/**
 * ひらがなをカタカナに変換
 */
export function hiraToKata(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/**
 * 文字列の徹底的な正規化
 * - NFKC（全角英数・記号の半角化）
 * - 小文字化
 * - ひらがな→カタカナ統一
 * - 空白・句読点・記号の除去
 */
export function normalizeText(str: string): string {
  return hiraToKata(str.normalize('NFKC'))
    .toLowerCase()
    .replace(/[\s\-_・、。！？,.!?]/g, '');
}

/**
 * レーベンシュタイン距離の計算
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // 削除
        dp[i][j - 1] + 1, // 挿入
        dp[i - 1][j - 1] + cost // 置換
      );
    }
  }

  return dp[m][n];
}

/**
 * 2つの文字列の類似度 (0.0 〜 1.0)
 */
export function textSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeText(s1);
  const norm2 = normalizeText(s2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // 片方がもう片方を完全に含んでいる場合（部分一致）
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    return minLen / maxLen;
  }

  const distance = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  return 1 - distance / maxLen;
}

export interface MatchResult {
  isMatch: boolean;
  isClose: boolean; // ほぼ合っている（サジェスト対象）
  confidence: number; // 0.0 - 1.0
  matchedTarget: string;
}

/**
 * ユーザー入力が模範解答または別解とマッチするか判定
 */
export function evaluateTextAnswer(
  userAnswer: string,
  modelAnswer: string,
  acceptableAnswers: string[] = []
): MatchResult {
  const candidates = [modelAnswer, ...acceptableAnswers].filter(Boolean);
  let bestConfidence = 0;
  let bestTarget = modelAnswer;

  for (const candidate of candidates) {
    const similarity = textSimilarity(userAnswer, candidate);
    if (similarity > bestConfidence) {
      bestConfidence = similarity;
      bestTarget = candidate;
    }
  }

  // 1.0 は完全一致
  // 0.75 以上は「ほぼ合っている（タイポや送り仮名等の軽微なズレ）」
  const isMatch = bestConfidence >= 0.99;
  const isClose = bestConfidence >= 0.72;

  return {
    isMatch,
    isClose,
    confidence: bestConfidence,
    matchedTarget: bestTarget,
  };
}
