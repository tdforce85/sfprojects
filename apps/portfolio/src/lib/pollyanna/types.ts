export interface Family {
  id: string;
  name: string;
  kids: string[];
}

export interface Assignment {
  giver: string;
  receiver: string;
}

// giver, receiver, budget, date
export interface RevealPayload {
  v: 1;
  g: string;
  r: string;
  b: string;
  d: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}
