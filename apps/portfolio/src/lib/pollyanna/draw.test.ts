import { describe, expect, it } from "vitest";
import { drawAssignments, validateRoster } from "./draw";
import type { Assignment, Family } from "./types";

function fam(id: string, kids: string[]): Family {
  return { id, name: `Family ${id}`, kids };
}

// Fake names only.
const FIXTURE: Family[] = [
  fam("A", ["A1", "A2", "A3"]),
  fam("B", ["B1", "B2"]),
  fam("C", ["C1", "C2"]),
  fam("D", ["D1"]),
  fam("E", ["E1"]),
];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function familyOf(families: Family[], kid: string): string {
  return families.find((f) => f.kids.includes(kid))?.id ?? "";
}

function assertValid(families: Family[], result: Assignment[]): void {
  const kids = families.flatMap((f) => f.kids);
  expect(result).toHaveLength(kids.length);
  expect(result.map((r) => r.giver).sort()).toEqual([...kids].sort());
  expect(result.map((r) => r.receiver).sort()).toEqual([...kids].sort());
  for (const { giver, receiver } of result) {
    expect(giver).not.toBe(receiver);
    expect(familyOf(families, giver)).not.toBe(familyOf(families, receiver));
  }
}

describe("validateRoster", () => {
  it("accepts the fixture", () => {
    expect(validateRoster(FIXTURE)).toEqual({ ok: true, errors: [] });
  });

  it("rejects a family with more than half the kids", () => {
    const roster = [
      fam("X", ["X1", "X2", "X3", "X4", "X5"]),
      fam("Y", ["Y1", "Y2"]),
      fam("Z", ["Z1", "Z2"]),
    ];
    const result = validateRoster(roster);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain(
      "The Family X family has 5 of 9 kids."
    );
    expect(() => drawAssignments(roster)).toThrow();
  });

  it("allows a family with exactly half", () => {
    const roster = [fam("X", ["X1", "X2", "X3", "X4"]), fam("Y", ["Y1", "Y2"]), fam("Z", ["Z1", "Z2"])];
    expect(validateRoster(roster).ok).toBe(true);
    for (let i = 0; i < 200; i++) assertValid(roster, drawAssignments(roster));
  });

  it("flags duplicate names case-insensitively", () => {
    const result = validateRoster([fam("A", ["Sam", "Al"]), fam("B", ["sam", "Bo"])]);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain('Two kids are named "Sam"');
  });

  it("ignores empty names and empty families", () => {
    const result = validateRoster([...FIXTURE, fam("Empty", ["", "  "]), fam("Blank", [])]);
    expect(result.ok).toBe(true);
    assertValid(FIXTURE, drawAssignments([...FIXTURE, fam("Empty", [" "])]));
  });

  it("requires at least two families", () => {
    const result = validateRoster([fam("A", ["A1", "A2", "A3"]), fam("B", [])]);
    expect(result.errors).toContain("Need at least two families.");
  });

  it("requires at least three kids", () => {
    const result = validateRoster([fam("A", ["A1"]), fam("B", ["B1"])]);
    expect(result.errors).toContain("Need at least three kids.");
  });
});

describe("drawAssignments", () => {
  it("never produces self or sibling matches (seeded, 10,000 draws)", () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 10_000; i++) assertValid(FIXTURE, drawAssignments(FIXTURE, rng));
  });

  it("never produces self or sibling matches (default rng)", () => {
    for (let i = 0; i < 1_000; i++) assertValid(FIXTURE, drawAssignments(FIXTURE));
  });

  it("every allowed pair occurs at least once (20,000 draws)", () => {
    const rng = mulberry32(987);
    const seen = new Set<string>();
    for (let i = 0; i < 20_000; i++) {
      for (const a of drawAssignments(FIXTURE, rng)) seen.add(`${a.giver}>${a.receiver}`);
    }
    const kids = FIXTURE.flatMap((f) => f.kids);
    for (const g of kids) {
      for (const r of kids) {
        if (familyOf(FIXTURE, g) !== familyOf(FIXTURE, r)) {
          expect(seen.has(`${g}>${r}`)).toBe(true);
        }
      }
    }
  });
});
