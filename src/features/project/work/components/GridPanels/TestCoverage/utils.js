export const kiloFormat = (num) => {
  if (num >= 1000000) {
    return `${num / 1000000}m`;
  }

  if (num >= 100000) {
    return `${num / 1000}k'`;
  }

  if (num >= 1000) {
    return `${num / 1000}k`;
  }

  return num;
};

export const toPercent = (testCoverage) => {
  const { denominator, numerator } = testCoverage;
  return denominator !== 0 ? (numerator * 100) / denominator : 0.0;
};
