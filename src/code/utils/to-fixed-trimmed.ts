// removes trailing zeros and trailing decimal if all zeros are removed
export const toFixedTrimmed = (value: number, precision: number) => {
  return value.toFixed(precision).replace(/0+$/, "").replace(/\.$/, "");
};
