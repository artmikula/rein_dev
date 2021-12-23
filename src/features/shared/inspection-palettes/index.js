export const RULE_CODES = {
  RULE1: 'rule1',
  RULE2: 'rule2',
  RULE3: 'rule3',
};

export const PALETTE_CODES = {
  PALETTE1: 'palette1',
  PALETTE2: 'palette2',
  PALETTE3: 'palette3',
  Trend: 'Trend',
  Seasonal: 'Seasonal',
  Outlier: 'Outlier',
  SimpleAbruptChanges: 'SimpleAbruptChanges',
  SmoothAbruptChanges: 'SmoothAbruptChanges',
  ConstantVariance: 'ConstantVariance',
  WhiteNoise: 'WhiteNoise',
  GaussianNoise: 'GaussianNoise',
  SamplingRate: 'SamplingRate',
  SignalIntensity: 'SignalIntensity',
  SignalMissing: 'SignalMissing',
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
  [PALETTE_CODES.Trend]: {
    code: PALETTE_CODES.Trend,
    name: 'Trend',
    rules: new Set(),
  },
  [PALETTE_CODES.Seasonal]: {
    code: PALETTE_CODES.Seasonal,
    name: 'Seasonal',
    rules: new Set(),
  },
  [PALETTE_CODES.Outlier]: {
    code: PALETTE_CODES.Outlier,
    name: 'Outlier',
    rules: new Set(),
  },
  [PALETTE_CODES.SimpleAbruptChanges]: {
    code: PALETTE_CODES.SimpleAbruptChanges,
    name: 'Simple Abrupt Changes',
    rules: new Set(),
  },
  [PALETTE_CODES.SmoothAbruptChanges]: {
    code: PALETTE_CODES.SmoothAbruptChanges,
    name: 'Smooth Abrupt Changes',
    rules: new Set(),
  },
  [PALETTE_CODES.ConstantVariance]: {
    code: PALETTE_CODES.ConstantVariance,
    name: 'Constant Variance',
    rules: new Set(),
  },
  [PALETTE_CODES.WhiteNoise]: {
    code: PALETTE_CODES.WhiteNoise,
    name: 'White Noise',
    rules: new Set(),
  },
  [PALETTE_CODES.GaussianNoise]: {
    code: PALETTE_CODES.GaussianNoise,
    name: 'Gaussian Noise',
    rules: new Set(),
  },
  [PALETTE_CODES.SamplingRate]: {
    code: PALETTE_CODES.SamplingRate,
    name: 'Sampling Rate',
    rules: new Set(),
  },
  [PALETTE_CODES.SignalIntensity]: {
    code: PALETTE_CODES.SignalIntensity,
    name: 'Signal Intensity',
    rules: new Set(),
  },
  [PALETTE_CODES.SignalMissing]: {
    code: PALETTE_CODES.SignalMissing,
    name: 'Signal Missing',
    rules: new Set(),
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
