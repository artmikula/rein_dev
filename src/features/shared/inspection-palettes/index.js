export const RULE_CODE = {
  SAG: 'SAG',
  SWELL: 'SWELL',
  INTERRUPTION: 'INTERRUPTION',
};

export const inspectionPalettes = [
  { id: 1, name: 'Electronic', rules: new Set([RULE_CODE.SAG, RULE_CODE.SWELL]) },
  { id: 2, name: 'Electric power', rules: new Set([RULE_CODE.SAG, RULE_CODE.INTERRUPTION]) },
  { id: 3, name: 'Electronic current', rules: new Set([RULE_CODE.SWELL, RULE_CODE.INTERRUPTION]) },
];
export const inspectionRules = [
  { code: RULE_CODE.SAG, name: 'SAG' },
  { code: RULE_CODE.SWELL, name: 'SWELL' },
  { code: RULE_CODE.INTERRUPTION, name: 'INTERRUPTION' },
];
