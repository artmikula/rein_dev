export const RULE_CODES = {
  RULE1: 'rule1', // Sag, Swell, Interruption Node have to connected with 'One and Only' constraint
  RULE2: 'rule2',
  RULE3: 'rule3',
  RULE4: 'rule4',
  RULE5: 'rule5',
  RULE6: 'rule6',
};

export const PALETTE_CODES = {
  // Energy Data
  Voltage: 'Voltage',
  Current: 'Current',
  PowerFactor: 'PowerFactor',
  PowerConsumption: 'PowerConsumption',
  InsulationResistance: 'InsulationResistance',
  Temperature: 'Temperature',
  Humidity: 'Humidity',
  Weather: 'Weather',
  WindSpeed: 'WindSpeed',
  Vibration: 'Vibration',

  // Data Generation
  Sag: 'Sag',
  Swell: 'Swell',
  Interruption: 'Interruption',

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
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

export const INSPECTION_PALETTES = {
  [PALETTE_CODES.Voltage]: {
    code: PALETTE_CODES.Voltage,
    name: 'Voltage',
    koName: '전압',
    rules: new Set([RULE_CODES.RULE2, RULE_CODES.RULE3, RULE_CODES.RULE4, RULE_CODES.RULE5, RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.Current]: {
    code: PALETTE_CODES.Current,
    name: 'Current',
    koName: '전류',
    rules: new Set([RULE_CODES.RULE2, RULE_CODES.RULE3, RULE_CODES.RULE4, RULE_CODES.RULE5, RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.PowerFactor]: {
    code: PALETTE_CODES.PowerFactor,
    name: 'Power factor',
    koName: '역률',
    rules: new Set([RULE_CODES.RULE2, RULE_CODES.RULE3, RULE_CODES.RULE4, RULE_CODES.RULE5, RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.PowerConsumption]: {
    code: PALETTE_CODES.PowerConsumption,
    name: 'Power Consumption',
    koName: '소모 전력',
    rules: new Set([RULE_CODES.RULE2, RULE_CODES.RULE3, RULE_CODES.RULE4, RULE_CODES.RULE5, RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.InsulationResistance]: {
    code: PALETTE_CODES.InsulationResistance,
    name: 'Insulation Resistance',
    koName: '절연저항',
    rules: new Set([RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.Temperature]: {
    code: PALETTE_CODES.Temperature,
    name: 'Temperature',
    koName: '온도',
    rules: new Set([RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.Humidity]: {
    code: PALETTE_CODES.Humidity,
    name: 'Humidity',
    koName: '습도',
    rules: new Set([RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.Weather]: {
    code: PALETTE_CODES.Weather,
    name: 'Weather',
    koName: '날씨',
    rules: new Set(),
  },
  [PALETTE_CODES.WindSpeed]: {
    code: PALETTE_CODES.WindSpeed,
    name: 'Wind Speed',
    koName: '풍속',
    rules: new Set([RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.Vibration]: {
    code: PALETTE_CODES.Vibration,
    name: 'Vibration',
    koName: '진동',
    rules: new Set([RULE_CODES.RULE6]),
  },
  [PALETTE_CODES.Sag]: {
    code: PALETTE_CODES.Sag,
    name: 'Sag',
    rules: new Set([RULE_CODES.RULE1]),
  },
  [PALETTE_CODES.Swell]: {
    code: PALETTE_CODES.Swell,
    name: 'Swell',
    rules: new Set([RULE_CODES.RULE1]),
  },
  [PALETTE_CODES.Interruption]: {
    code: PALETTE_CODES.Interruption,
    name: 'Interruption',
    rules: new Set([RULE_CODES.RULE1]),
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
    name: 'Sag, Swell and Interruption cannot occur simultaneously.',
    type: RULE_TYPE.ERROR,
  },
  [RULE_CODES.RULE2]: {
    code: RULE_CODES.RULE2,
    name: 'Have you considered the sag phenomenon?',
    type: RULE_TYPE.INFO,
  },
  [RULE_CODES.RULE3]: {
    code: RULE_CODES.RULE3,
    name: 'Have you considered the swell phenomenon?',
    type: RULE_TYPE.INFO,
  },
  [RULE_CODES.RULE4]: {
    code: RULE_CODES.RULE4,
    name: 'Have you considered the interruption phenomenon caused by the switchboard?',
    type: RULE_TYPE.INFO,
  },
  [RULE_CODES.RULE5]: {
    code: RULE_CODES.RULE5,
    name: 'Have you considered interruption caused by electromagnetic interference?',
    type: RULE_TYPE.INFO,
  },
  [RULE_CODES.RULE6]: {
    code: RULE_CODES.RULE6,
    name: 'Have you accounted for signal dropout when connecting wirelessly?',
    type: RULE_TYPE.INFO,
  },
};

export const getHighestRuleType = (ruleStr) => {
  if (!ruleStr) {
    return RULE_TYPE.ERROR;
  }
  const rules = ruleStr.split(',');

  const hasError = !!rules.find((r) => INSPECTION_RULES[r].type === RULE_TYPE.ERROR);
  if (hasError) {
    return RULE_TYPE.ERROR;
  }

  const hasWarning = !!rules.find((r) => INSPECTION_RULES[r].type === RULE_TYPE.WARNING);
  if (hasWarning) {
    return RULE_TYPE.WARNING;
  }

  return RULE_TYPE.INFO;
};
