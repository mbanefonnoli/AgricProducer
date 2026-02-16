export type UnitType = 'weight' | 'volume' | 'count';

interface UnitInfo {
    label: string;
    type: UnitType;
    ratio: number; // relative to base unit
}

export const UNIT_MAP: Record<string, UnitInfo> = {
    // Weight (Base: kg)
    'kg': { label: 'Kilograms', type: 'weight', ratio: 1 },
    'tons': { label: 'Tons', type: 'weight', ratio: 1000 },
    'g': { label: 'Grams', type: 'weight', ratio: 0.001 },
    'lbs': { label: 'Pounds', type: 'weight', ratio: 0.453592 },

    // Volume (Base: liters)
    'liters': { label: 'Liters', type: 'volume', ratio: 1 },
    'ml': { label: 'Milliliters', type: 'volume', ratio: 0.001 },
    'gal': { label: 'Gallons', type: 'volume', ratio: 3.78541 },

    // Count (Base: units)
    'units': { label: 'Units', type: 'count', ratio: 1 },
    'bags': { label: 'Bags', type: 'count', ratio: 1 }, // Assumption: 1 bag = 1 unit unless specified
    'crates': { label: 'Crates', type: 'count', ratio: 1 },
    'doz': { label: 'Dozen', type: 'count', ratio: 12 },
};

/**
 * Converts an amount from one unit to another.
 * If units are not in the same group (e.g. Weight -> Volume), 
 * it returns the original amount without conversion.
 */
export function convertUnit(amount: number, fromUnit: string, toUnit: string): number {
    const from = UNIT_MAP[fromUnit.toLowerCase()];
    const to = UNIT_MAP[toUnit.toLowerCase()];

    if (!from || !to) return amount;
    if (from.type !== to.type) return amount; // Incompatible types

    // Convert to base unit first, then to target unit
    const amountInBase = amount * from.ratio;
    return amountInBase / to.ratio;
}

export function getUnitsByType(type: UnitType) {
    return Object.entries(UNIT_MAP).filter(([_, info]) => info.type === type);
}
