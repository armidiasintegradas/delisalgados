export const MIN_FLAVOR_QUANTITY = 25;
export const MIN_ORDER_UNITS = 50;

export function isUnitBasedMinimum(minimumQuantity: number, unitLabel?: string | null) {
  return minimumQuantity >= MIN_FLAVOR_QUANTITY &&
    (unitLabel || "").trim().toUpperCase() === "UND";
}

export function quantityStep(minimumQuantity: number, unitLabel?: string | null) {
  return isUnitBasedMinimum(minimumQuantity, unitLabel) ? MIN_FLAVOR_QUANTITY : 1;
}
