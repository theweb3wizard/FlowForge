import { PATTERNS, type SolidPattern } from './templates';

// Strip common filler words and normalize to lowercase
function normalize(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could',
    'should', 'may', 'might', 'shall', 'need', 'like', 'make', 'want', 'create',
    'build', 'deploy', 'generate', 'contract', 'solidity', 'smart', 'simple',
    'basic', 'custom', 'new', 'add', 'get', 'set', 'use', 'using', 'write',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

type ScoredPattern = {
  pattern: SolidPattern;
  score: number;
};

export function retrievePatterns(prompt: string, maxResults = 3): SolidPattern[] {
  const tokens = new Set(normalize(prompt));
  if (tokens.size === 0) return [];

  const scored: ScoredPattern[] = [];

  for (const pattern of PATTERNS) {
    let score = 0;

    // Score against all keywords
    for (const keyword of pattern.keywords) {
      const keywordTokens = normalize(keyword);
      for (const kt of keywordTokens) {
        if (tokens.has(kt)) {
          score += 2;
        }
      }
    }

    // Score against name and description
    const nameTokens = normalize(pattern.name);
    const descTokens = normalize(pattern.description);

    for (const nt of nameTokens) {
      if (tokens.has(nt)) score += 3;
    }

    for (const dt of descTokens) {
      if (tokens.has(dt)) score += 1;
    }

    // Exact phrase bonus: check if any keyword appears as a substring in the prompt
    const lowerPrompt = prompt.toLowerCase();
    for (const keyword of pattern.keywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.push({ pattern, score });
    }
  }

  // Sort by score descending, pick top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.pattern);
}
