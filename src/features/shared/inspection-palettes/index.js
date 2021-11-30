export const RULE_CODES = {
  RULE1: 'rule1',
  RULE2: 'rule2',
  RULE3: 'rule3',
};

export const PALETTE_CODES = {
  PALETTE1: 'palette1',
  PALETTE2: 'palette2',
  PALETTE3: 'palette3',
};

export const RULE_TYPE = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

export const INSPECTION_PALETTES = {
  [PALETTE_CODES.PALETTE1]: {
    code: PALETTE_CODES.PALETTE1,
    name: 'Electronic',
    rules: new Set([RULE_CODES.RULE1, RULE_CODES.RULE2]),
  },
  [PALETTE_CODES.PALETTE2]: {
    code: PALETTE_CODES.PALETTE2,
    name: 'Electric power',
    rules: new Set([RULE_CODES.RULE1, RULE_CODES.RULE3]),
  },
  [PALETTE_CODES.PALETTE3]: {
    code: PALETTE_CODES.PALETTE3,
    name: 'Electronic current',
    rules: new Set([RULE_CODES.RULE2, RULE_CODES.RULE3]),
  },
};

export const INSPECTION_RULES = {
  [RULE_CODES.RULE1]: {
    code: RULE_CODES.RULE1,
    name: 'SAG and SWELL cannot occur at the same time',
    type: RULE_TYPE.ERROR,
  },
  [RULE_CODES.RULE2]: {
    code: RULE_CODES.RULE2,
    name: 'SAG and INTERRUPTION cannot occur simultaneously',
    type: RULE_TYPE.ERROR,
  },
  [RULE_CODES.RULE3]: {
    code: RULE_CODES.RULE3,
    name: 'SWELL and INTERRUPTION cannot occur simultaneously',
    type: RULE_TYPE.ERROR,
  },
};
