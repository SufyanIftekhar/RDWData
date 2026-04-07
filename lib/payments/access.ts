const sessionPaidPlates = new Set<string>();

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export function hasPaidAccessForPlate(plate: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionPaidPlates.has(normalizePlate(plate));
}

export function grantPaidAccessForPlate(plate: string) {
  if (typeof window === "undefined") return;
  sessionPaidPlates.add(normalizePlate(plate));
}

export function clearPaidAccessForPlate(plate: string): void {
  if (typeof window === "undefined") return;
  sessionPaidPlates.delete(normalizePlate(plate));
}
