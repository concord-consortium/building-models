export const stepSize = (options: {min: number, max: number}) => {
  const { min, max } = options;
  return Math.min(1, (max - min) / 100);
};

