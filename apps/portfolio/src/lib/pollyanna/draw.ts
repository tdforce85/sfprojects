import type { Assignment, Family, ValidationResult } from "./types";

type Rng = () => number;

const MAX_ATTEMPTS = 200_000;

interface Kid {
  name: string;
  family: number;
}

interface CleanFamily {
  name: string;
  kids: string[];
}

function clean(families: Family[]): CleanFamily[] {
  return families
    .map((f) => ({
      name: f.name.trim(),
      kids: f.kids.map((k) => k.trim()).filter((k) => k.length > 0),
    }))
    .filter((f) => f.kids.length > 0);
}

export function validateRoster(families: Family[]): ValidationResult {
  const errors: string[] = [];
  const fams = clean(families);
  const n = fams.reduce((sum, f) => sum + f.kids.length, 0);

  if (fams.length < 2) errors.push("Need at least two families.");
  if (n < 3) errors.push("Need at least three kids.");

  const seen = new Map<string, string>();
  const reported = new Set<string>();
  for (const f of fams) {
    for (const kid of f.kids) {
      const key = kid.toLowerCase();
      const first = seen.get(key);
      if (first === undefined) {
        seen.set(key, kid);
      } else if (!reported.has(key)) {
        reported.add(key);
        errors.push(
          `Two kids are named "${first}". Add an initial so links are unambiguous.`
        );
      }
    }
  }

  if (fams.length > 0) {
    const largest = fams.reduce((a, b) => (b.kids.length > a.kids.length ? b : a));
    const m = largest.kids.length;
    if (m > n - m) {
      const label = largest.name.length > 0 ? largest.name : "Unnamed";
      errors.push(
        `The ${label} family has ${m} of ${n} kids. No family can have more than half, or a fair draw is impossible.`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

// Unbiased integer in [0, max) from crypto, via rejection on Uint32.
function cryptoInt(max: number): number {
  const range = 0x100000000;
  const limit = range - (range % max);
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function randInt(max: number, rng?: Rng): number {
  return rng ? Math.min(max - 1, Math.floor(rng() * max)) : cryptoInt(max);
}

function shuffle<T>(items: T[], rng?: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1, rng);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(givers: Kid[], receivers: Kid[]): boolean {
  return givers.every((g, i) => g.family !== receivers[i].family);
}

function backtrack(kids: Kid[], rng?: Rng): Kid[] | null {
  const sizes = new Map<number, number>();
  for (const k of kids) sizes.set(k.family, (sizes.get(k.family) ?? 0) + 1);
  const order = shuffle(kids, rng).sort(
    (a, b) => (sizes.get(b.family) ?? 0) - (sizes.get(a.family) ?? 0)
  );
  const used = new Set<Kid>();
  const result: Kid[] = [];

  function place(i: number): boolean {
    if (i === order.length) return true;
    const candidates = shuffle(
      kids.filter((c) => !used.has(c) && c.family !== order[i].family),
      rng
    );
    for (const c of candidates) {
      used.add(c);
      result[i] = c;
      if (place(i + 1)) return true;
      used.delete(c);
    }
    return false;
  }

  if (!place(0)) return null;
  // Map back to original giver order.
  const byGiver = new Map<Kid, Kid>();
  order.forEach((g, i) => byGiver.set(g, result[i]));
  return kids.map((g) => byGiver.get(g) as Kid);
}

// Rejection sampling is uniform over valid draws. The backtracking fallback is
// not, but it only runs if sampling exhausts maxAttempts, which does not happen
// at family-sized rosters.
export function drawAssignments(
  families: Family[],
  rng?: Rng,
  maxAttempts: number = MAX_ATTEMPTS
): Assignment[] {
  const validation = validateRoster(families);
  if (!validation.ok) throw new Error(validation.errors.join(" "));

  const kids: Kid[] = clean(families).flatMap((f, family) =>
    f.kids.map((name) => ({ name, family }))
  );

  let receivers: Kid[] | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = shuffle(kids, rng);
    if (isValid(kids, candidate)) {
      receivers = candidate;
      break;
    }
  }
  receivers ??= backtrack(kids, rng);
  if (!receivers) throw new Error("Could not find a valid draw.");

  return kids.map((g, i) => ({ giver: g.name, receiver: receivers[i].name }));
}
