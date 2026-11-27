/**
 * Small, dependency-free fuzzy matcher for the prompt library. It is deliberately
 * token based: every word in the query must match somewhere, while title and tag
 * matches outrank description and prompt-body matches. Besides exact and prefix
 * matching it understands small typos, subsequences ("untangle" → "utgl") and
 * acronyms ("cwv" → "core web vitals").
 */

export interface FuzzyDocument {
  title: string;
  description?: string;
  tags?: string[];
  phase?: string;
  purpose?: string;
  author?: string;
  preview?: string[];
}

export interface FuzzyResult {
  matched: boolean;
  score: number;
}

export const FUZZY_RELEVANCE_CUTOFF = 0.55;

/** Whether a score is close enough to the best score for the same query to be shown. */
export function relevantFuzzyScore(score: number, bestScore: number): boolean {
  return score > 0 && score >= bestScore * FUZZY_RELEVANCE_CUTOFF;
}

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Words in a query or document, with punctuation and separators removed. */
export function tokenize(value: string): string[] {
  return normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Levenshtein distance, stopping as soon as it is clear the edit budget is spent. */
function editDistance(a: string, b: string, budget: number): number {
  if (Math.abs(a.length - b.length) > budget) return budget + 1;
  if (!a) return b.length;
  if (!b) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMinimum = i;
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      const value = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
      current[j] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }
    if (rowMinimum > budget) return budget + 1;
    previous = current;
  }
  return previous[b.length];
}

/** Ordered-character score for matches like "utgl" in "untangle". */
function subsequenceScore(term: string, word: string): number {
  if (term.length < 3 || term.length > word.length) return 0;
  let at = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < word.length && at < term.length; i++) {
    if (word[i] !== term[at]) continue;
    if (first < 0) first = i;
    last = i;
    at++;
  }
  if (at !== term.length) return 0;

  const span = last - first + 1;
  const compactness = term.length / span;
  const coverage = term.length / word.length;
  // Subsequence matches are useful for a deliberate fuzzy query, but they should
  // never compete with a real word or prefix match.
  return Math.min(0.38, 0.08 + compactness * 0.16 + coverage * 0.14);
}

function typoAllowance(term: string): number {
  // One edit in a four-letter word is often a different real word ("vite"/"site"),
  // so typo tolerance starts a little later than the subsequence matcher.
  if (term.length < 5) return 0;
  if (term.length < 8) return 1;
  return 2;
}

/** Score one query term against one word, from 0 (no match) to 1 (exact). */
function scoreWord(term: string, word: string): number {
  if (!term || !word) return 0;
  if (word === term) return 1;
  if (word.startsWith(term)) {
    // Prefixes matter for search-as-you-type, but their strength drops quickly
    // when only a small part of the word has been typed ("ci" in "client").
    const ratio = term.length / word.length;
    return Math.min(0.9, 0.42 + Math.pow(ratio, 1.35) * 0.48);
  }
  if (word.includes(term)) {
    // Interior substrings are weaker still; otherwise "rust" would match every
    // mention of "infrastructure" as if it were the Rust programming language.
    const ratio = term.length / word.length;
    return Math.min(0.68, 0.18 + ratio * ratio * 0.5);
  }

  const edits = editDistance(term, word, typoAllowance(term));
  if (edits <= typoAllowance(term)) {
    const coverage = Math.min(term.length, word.length) / Math.max(term.length, word.length);
    return Math.max(0.42, 0.72 - edits * 0.11 + coverage * 0.08);
  }

  return subsequenceScore(term, word);
}

function scoreText(term: string, text: string | undefined, weight: number): number {
  if (!text) return 0;
  const words = tokenize(text);
  if (!words.length) return 0;

  let best = 0;
  for (const word of words) best = Math.max(best, scoreWord(term, word));

  // Acronyms make queries like "cwv" useful for "core web vitals".
  const acronym = words.map((word) => word[0]).join("");
  if (term.length >= 2 && acronym.startsWith(term)) {
    best = Math.max(best, 0.76 + Math.min(term.length / acronym.length, 1) * 0.1);
  }

  return best * weight;
}

function containsSequence(words: string[], sequence: string[]): boolean {
  if (!sequence.length || sequence.length > words.length) return false;
  outer: for (let start = 0; start <= words.length - sequence.length; start++) {
    for (let i = 0; i < sequence.length; i++) {
      if (words[start + i] !== sequence[i]) continue outer;
    }
    return true;
  }
  return false;
}

const join = (values: (string | undefined)[] | undefined) =>
  (values ?? []).filter(Boolean).join(" ");

/**
 * Scores `query` against a prompt document. A document matches only when every
 * query term is found in at least one field; terms may be split across fields
 * ("react performance"). Higher scores are better, with exact title/tag matches
 * ranked above incidental matches in prose or preview lines.
 */
export function fuzzyScore(query: string, document: FuzzyDocument): FuzzyResult {
  const terms = tokenize(query);
  if (!terms.length) return { matched: true, score: 0 };

  const fields: { texts: (string | undefined)[]; weight: number }[] = [
    { texts: [document.title], weight: 110 },
    // Tags are scored one at a time so acronyms stay meaningful ("cwv" for core-web-vitals).
    { texts: document.tags ?? [], weight: 96 },
    { texts: [document.description], weight: 68 },
    { texts: [document.phase, document.purpose], weight: 72 },
    { texts: [document.author], weight: 38 },
    { texts: [join(document.preview)], weight: 28 },
  ];

  let score = 0;
  for (const term of terms) {
    const best = Math.max(
      ...fields.flatMap(({ texts, weight }) => texts.map((text) => scoreText(term, text, weight))),
    );
    if (best <= 0) return { matched: false, score: 0 };
    score += best;
  }

  // Reward the complete query appearing as a consecutive phrase. This keeps
  // "audit web performance" ahead of documents that merely contain each word.
  if (terms.length > 1) {
    if (containsSequence(tokenize(document.title), terms)) score += 34;
    if (document.tags?.some((tag) => containsSequence(tokenize(tag), terms))) score += 26;
    if (document.description && containsSequence(tokenize(document.description), terms)) {
      score += 14;
    }
  }

  return { matched: true, score };
}
