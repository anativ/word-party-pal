// Offline, rule-based sentence checker for the "Sentence Challenge" mode.
// No external service. It catches common basic mistakes only; it cannot
// fully judge grammar or meaning (see SentenceGame.tsx / PR notes).

export interface SentenceIssue {
  level: "error" | "tip";
  message: string;
}

export interface SentenceResult {
  ok: boolean;
  issues: SentenceIssue[];
}

const tokenize = (s: string): string[] =>
  s.toLowerCase().replace(/[’]/g, "'").match(/[a-z]+(?:'[a-z]+)?/g) ?? [];

// Turn a word-list entry such as "to run (fast)" or "big / large" into
// the alternative base forms the learner may use.
export const baseForms = (english: string): string[][] => {
  const cleaned = english.replace(/\([^)]*\)/g, " ");
  const alts = cleaned.split(/[/,;]/).map((a) => a.trim()).filter(Boolean);
  return alts
    .map((a) => tokenize(a.replace(/^to\s+/i, "")))
    .filter((t) => t.length > 0);
};

// Common irregular forms -> base form
const IRREGULAR: Record<string, string> = {
  ran: "run", went: "go", gone: "go", ate: "eat", eaten: "eat", saw: "see", seen: "see",
  took: "take", taken: "take", gave: "give", given: "give", came: "come", made: "make",
  got: "get", bought: "buy", found: "find", sat: "sit", wrote: "write", written: "write",
  read: "read", said: "say", knew: "know", known: "know", thought: "think", felt: "feel",
  had: "have", was: "be", were: "be", did: "do", done: "do", men: "man", women: "woman",
  children: "child", feet: "foot", teeth: "tooth", mice: "mouse", people: "person",
  drank: "drink", drunk: "drink", slept: "sleep", swam: "swim", flew: "fly", drew: "draw",
  spoke: "speak", broke: "break", wore: "wear", sang: "sing", began: "begin", left: "leave",
};

const stem = (w: string): string[] => {
  const out = new Set<string>([w]);
  if (IRREGULAR[w]) out.add(IRREGULAR[w]);
  if (w.endsWith("ies")) out.add(w.slice(0, -3) + "y");
  if (w.endsWith("ied")) out.add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) out.add(w.slice(0, -2));
  if (w.endsWith("s")) out.add(w.slice(0, -1));
  if (w.endsWith("ed")) { out.add(w.slice(0, -2)); out.add(w.slice(0, -1)); }
  if (w.endsWith("ing")) {
    const b = w.slice(0, -3);
    out.add(b); out.add(b + "e");
    if (b.length > 2 && b[b.length - 1] === b[b.length - 2]) out.add(b.slice(0, -1));
  }
  if (w.endsWith("er") || w.endsWith("ly")) out.add(w.slice(0, -2));
  return [...out];
};

const sameWord = (a: string, b: string): boolean => {
  const sa = stem(a), sb = stem(b);
  return sa.some((x) => sb.includes(x) && x.length >= 2);
};

// Does the sentence contain the (possibly multi-word) target in order?
export const containsWord = (sentenceTokens: string[], english: string): boolean =>
  baseForms(english).some((target) => {
    for (let i = 0; i + target.length <= sentenceTokens.length; i++) {
      if (target.every((t, j) => sameWord(sentenceTokens[i + j], t))) return true;
    }
    return false;
  });

const VOWEL_START = /^[aeiou]/;
const A_EXCEPT = new Set(["hour", "honest", "heir", "honor"]); // "an hour"
const AN_EXCEPT = new Set(["university", "uniform", "unit", "user", "european", "one", "once", "useful", "usual"]);

export const checkSentence = (
  sentence: string,
  words: { english: string }[]
): SentenceResult => {
  const issues: SentenceIssue[] = [];
  const text = sentence.trim().replace(/\s+/g, " ");
  const tokens = tokenize(text);

  // 1. Both target words used
  for (const w of words) {
    if (!containsWord(tokens, w.english)) {
      issues.push({ level: "error", message: `The word "${w.english}" is missing from your sentence.` });
    }
  }

  // 2. Basic sentence shape
  if (tokens.length < 4) {
    issues.push({ level: "error", message: "Write a full sentence (at least 4 words)." });
  }
  if (text && !/^[A-Z]/.test(text)) {
    issues.push({ level: "error", message: "A sentence starts with a capital letter." });
  }
  if (text && !/[.!?]["')]?$/.test(text)) {
    issues.push({ level: "error", message: "End the sentence with . ! or ?" });
  }
  if (/(^|[^A-Za-z'])i(?=[^A-Za-z']|$)/.test(text)) {
    issues.push({ level: "error", message: 'Write "I" with a capital letter.' });
  }

  // 3. Simple grammar patterns
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i], n = tokens[i + 1];
    if (!n) break;
    if (t === n && !["had", "that"].includes(t)) {
      issues.push({ level: "error", message: `The word "${t}" is repeated twice in a row.` });
    }
    if (t === "a" && VOWEL_START.test(n) && !AN_EXCEPT.has(n)) {
      issues.push({ level: "error", message: `Use "an" before "${n}", not "a".` });
    }
    if (t === "an" && !VOWEL_START.test(n) && !A_EXCEPT.has(n)) {
      issues.push({ level: "error", message: `Use "a" before "${n}", not "an".` });
    }
    if (t === "i" && ["is", "are", "has", "does"].includes(n)) {
      issues.push({ level: "error", message: `After "I" use ${n === "is" || n === "are" ? '"am"' : n === "has" ? '"have"' : '"do"'}, not "${n}".` });
    }
    if (["he", "she", "it"].includes(t) && ["are", "have", "do", "am"].includes(n)) {
      const fix = { are: "is", have: "has", do: "does", am: "is" }[n as "are" | "have" | "do" | "am"];
      issues.push({ level: "error", message: `After "${t}" use "${fix}", not "${n}".` });
    }
    if (["you", "we", "they"].includes(t) && ["is", "has", "does", "am"].includes(n)) {
      const fix = { is: "are", has: "have", does: "do", am: "are" }[n as "is" | "has" | "does" | "am"];
      issues.push({ level: "error", message: `After "${t}" use "${fix}", not "${n}".` });
    }
  }
  const last = tokens[tokens.length - 1];
  if (last && ["the", "a", "an", "to", "of", "and", "but", "or", "in", "on", "at", "with"].includes(last)) {
    issues.push({ level: "error", message: `The sentence ends with "${last}" - it looks unfinished.` });
  }

  // 4. Needs some verb-like word (heuristic)
  const COMMON_VERBS = /^(am|is|are|was|were|be|been|have|has|had|do|does|did|can|could|will|would|should|must|may|might|go|goes|went|like|likes|want|wants|see|sees|saw|eat|eats|ate|play|plays|played|love|loves|make|makes|made|take|takes|took|get|gets|got|put|puts|give|gives|gave|say|says|said|come|comes|came|know|knows|knew|think|thinks|need|needs|live|lives|use|uses|look|looks|feel|feels|read|reads|write|writes|run|runs|ran|walk|walks|buy|buys|bought|find|finds|found|sit|sits|sat)$/;
  const hasVerb = tokens.some((t) => COMMON_VERBS.test(t) || /(ed|ing)$/.test(t) || words.some((w) => baseForms(w.english).some((b) => b.length === 1 && b[0] === t)));
  if (tokens.length >= 4 && !hasVerb) {
    issues.push({ level: "tip", message: "I could not find a verb. A sentence usually needs one (for example: is, like, play)." });
  }

  // De-duplicate
  const seen = new Set<string>();
  const unique = issues.filter((i) => (seen.has(i.message) ? false : (seen.add(i.message), true)));
  return { ok: unique.every((i) => i.level !== "error"), issues: unique };
};
