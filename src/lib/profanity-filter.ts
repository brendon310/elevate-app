// Lightweight client + server safe profanity / inappropriate content filter.
// Catches common English profanity, slurs, sexual terms, and simple obfuscations
// (l33t-speak, repeated chars). Not exhaustive — pairs with Claude moderation
// as a deeper backstop when available.

const BLOCKED_PATTERNS: RegExp[] = [
  // Sexual / vulgar
  /\bf+u+c+k+\w*/i,
  /\bf+[\W_]*u+[\W_]*c+[\W_]*k+/i,
  /\bf[\*\@\#]ck/i,
  /\bsh+i+t+\w*/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bb+i+t+c+h+\w*/i,
  /\bc+u+n+t+\w*/i,
  /\bd+i+c+k+\w*/i,
  /\bp+u+s+s+y+\w*/i,
  /\bc+o+c+k+\w*/i,
  /\bp+e+n+i+s+\w*/i,
  /\bv+a+g+i+n+a+\w*/i,
  /\bb+o+o+b+s*\b/i,
  /\bt+i+t+s*\b/i,
  /\bn+i+p+p+l+e+/i,
  /\bs+e+x+y*\b/i,
  /\bp+o+r+n+\w*/i,
  /\bn+u+d+e+\w*/i,
  /\bn+a+k+e+d+\b/i,
  /\bh+o+r+n+y+\b/i,
  /\bm+a+s+t+u+r+b+/i,
  /\bj+e+r+k\s*o+f+f+/i,
  /\bb+l+o+w+j+o+b+/i,
  /\bh+a+n+d+j+o+b+/i,
  /\bo+r+g+a+s+m+/i,
  /\bc+u+m+m*\b/i,
  /\bs+e+m+e+n+\b/i,
  /\bw+h+o+r+e+\b/i,
  /\bs+l+u+t+\b/i,
  /\br+a+p+e+\w*/i,
  // Slurs (common ones — kept short on purpose)
  /\bn+i+g+\w*/i,
  /\bf+a+g+\w*/i,
  /\br+e+t+a+r+d+\w*/i,
  /\bt+r+a+n+n+y+\w*/i,
  // Violence / self-harm threats
  /\bk+i+l+l\s+y+o+u+r+s+e+l+f+/i,
  /\bk+y+s+\b/i,
  // Common leetspeak forms
  /\bf[u\*\@]ck/i,
  /\b[s\$]hit\b/i,
  /\ba[s\$][s\$]\b/i,
  // Spam patterns
  /(https?:\/\/|www\.)\S+/i,
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/i,
];

export type ProfanityCheckResult = {
  ok: boolean;
  reason?: string;
};

export function checkContent(input: string): ProfanityCheckResult {
  const text = (input ?? "").toString();
  const trimmed = text.trim();

  if (trimmed.length < 10) {
    return { ok: false, reason: "Too short — write a real reflection." };
  }
  if (trimmed.length > 280) {
    return { ok: false, reason: "Too long — keep it under 280 characters." };
  }

  // Normalize common obfuscations before matching.
  const normalized = trimmed
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/\$/g, "s")
    .replace(/@/g, "a")
    .replace(/\*/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(normalized)) {
      return { ok: false, reason: "blocked" };
    }
  }

  // Reject gibberish: long runs of the same char (e.g. "aaaaaaaaaa").
  if (/(.)\1{6,}/.test(trimmed)) {
    return { ok: false, reason: "Looks like keyboard mashing." };
  }

  // Reject no-vowel walls (probably keyboard mashing).
  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 12 && !/[aeiouAEIOU]/.test(letters)) {
    return { ok: false, reason: "Looks like keyboard mashing." };
  }

  return { ok: true };
}

export const REJECTION_LINES = [
  "Your coach read that. Not today. 🙏",
  "Nope. Try again with something real. 💬",
  "That's not it. Your future self is watching. 👀",
  "Save it for your group chat. Write something real here. ✍️",
  "Even autocorrect would block that. Try again. 🤖",
];

export function randomRejectionLine(): string {
  return REJECTION_LINES[Math.floor(Math.random() * REJECTION_LINES.length)];
}