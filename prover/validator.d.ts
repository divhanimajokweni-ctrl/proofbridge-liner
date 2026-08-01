export interface ValidatorReport {
  documentValid: boolean;
  rules: Record<string, boolean>;
}

export const RULES: Array<{ name: string; pattern: RegExp }>;
export function validateDeed(text: string): ValidatorReport;
