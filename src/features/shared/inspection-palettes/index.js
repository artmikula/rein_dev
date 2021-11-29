export const RULE_CODE = {
  RULE1: 'rule1',
  RULE2: 'rule2',
  RULE3: 'rule3',
};

export const inspectionPalettes = [
  { id: '1', name: 'Electronic', rules: new Set([RULE_CODE.RULE1, RULE_CODE.RULE2]) },
  { id: '2', name: 'Electric power', rules: new Set([RULE_CODE.RULE1, RULE_CODE.RULE3]) },
  { id: '3', name: 'Electronic current', rules: new Set([RULE_CODE.RULE2, RULE_CODE.RULE3]) },
];
export const inspectionRules = [
  { code: RULE_CODE.RULE1, name: 'SAG and SWELL cannot occur at the same time' },
  { code: RULE_CODE.RULE2, name: 'SAG and INTERRUPTION cannot occur simultaneously' },
  { code: RULE_CODE.RULE3, name: 'SWELL and INTERRUPTION cannot occur simultaneously' },
];
