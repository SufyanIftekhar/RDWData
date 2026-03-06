import { VehicleProfile } from "@/lib/rdw/types";
import { parseISO, differenceInMonths, differenceInYears } from "date-fns";

export type EnrichedData = {
    ageInMonths: number | null;
    ageString: string | null;
    isImported: boolean;
    maintenanceRiskScore: number; // 1.0 to 10.0
    estimatedValueNow: number | null;
    estimatedValueNextYear: number | null;
    apkPassChance: number; // Percentage 0-100
    repairChances: { name: string; chance: number; estMin: number; estMax: number }[];
    roadTaxEstQuarter: { min: number; max: number } | null;
    insuranceEstMonth: number | null;
    fuelEstMonth: number | null;
    knownIssues: { title: string; severity: string; target: string; advice: string }[];
};

export function enrichVehicleData(v: VehicleProfile["vehicle"]): EnrichedData {
    // 1. Age Calculation
    let ageInMonths = null;
    let ageString = null;
    if (v.firstRegistrationWorld) {
        const d = parseISO(v.firstRegistrationWorld);
        const now = new Date();
        ageInMonths = differenceInMonths(now, d);
        const years = differenceInYears(now, d);
        const months = ageInMonths % 12;
        ageString = `${years} years and ${months} months`;
    }

    // 2. Import Risk
    const isImported =
        !!v.firstRegistrationNL &&
        !!v.firstRegistrationWorld &&
        v.firstRegistrationNL !== v.firstRegistrationWorld;

    // 3. Maintenance Risk Score (Heuristic: Age + Empty Weight)
    let riskScore = 4.0; // Base score
    if (ageInMonths) {
        riskScore += ageInMonths / 60; // +1 point every 5 years
    }
    if (v.weight?.empty && v.weight.empty > 1500) {
        riskScore += 1.0; // Heavier = more wear (brakes, suspension)
    }
    if (v.fuelType === "Diesel") riskScore += 0.5;
    riskScore = Math.min(Math.max(riskScore, 1.0), 9.9);

    // 4. Depreciation (Heuristic)
    let valNow = null;
    let valNextYear = null;
    if (v.cataloguePrice && ageInMonths) {
        const yearsDec = ageInMonths / 12;
        // Simple mock curve: lose 15% first year, then exponential decay ~10-12% per year
        const retained = Math.pow(0.88, yearsDec);
        valNow = Math.round((v.cataloguePrice * retained) / 100) * 100;
        valNextYear = Math.round((valNow * 0.88) / 100) * 100;

        // Bottom out around 1000 for drivable cars
        if (valNow < 1000) valNow = 1000 + (Math.random() * 500);
        if (valNextYear < 900) valNextYear = 900 + (Math.random() * 200);
    }

    // 5. APK Pass Chance (Heuristic)
    let passChance = 85;
    if (ageInMonths && ageInMonths > 120) passChance -= 15;
    if (isImported) passChance -= 5;

    // 6. Repair Chances (Mocked for UI testing, would need B2B data for real)
    const repairChances = [];
    if (ageInMonths && ageInMonths > 80) {
        repairChances.push({ name: "Brakes (discs/pads)", chance: 75, estMin: 350, estMax: 600 });
        repairChances.push({ name: "Battery replacement", chance: 40, estMin: 100, estMax: 250 });
    }
    if (ageInMonths && ageInMonths > 140) {
        repairChances.push({ name: "Timing belt/chain", chance: 65, estMin: 400, estMax: 800 });
        repairChances.push({ name: "Shock absorbers", chance: 55, estMin: 300, estMax: 500 });
    }

    // 7. Road Tax Estimate (Extremely simplified)
    let taxMin = 0; let taxMax = 0;
    if (v.weight?.empty) {
        const w = v.weight.empty;
        if (v.fuelType === "Benzine") {
            taxMin = Math.floor(w * 0.05); taxMax = taxMin + 15;
        } else if (v.fuelType === "Diesel") {
            taxMin = Math.floor(w * 0.09); taxMax = taxMin + 25;
        } else if (v.fuelType === "Elektriciteit") {
            taxMin = 0; taxMax = 0; // temporary exemption
        } else {
            taxMin = Math.floor(w * 0.05); taxMax = taxMin + 20;
        }
    }
    const tax = taxMin > 0 ? { min: taxMin, max: taxMax } : null;

    // 8. Insurance Estimate (Heuristic based on Value & Weight)
    // Very rough heuristic: Base 25 + (Value * 0.0015) + (Weight * 0.01)
    let insuranceEst = null;
    if (valNow && v.weight?.empty) {
        insuranceEst = 25 + (valNow * 0.0015) + (v.weight.empty * 0.01);
        if (v.engine?.powerKw && v.engine.powerKw > 150) insuranceEst += 15; // fast car premium
        insuranceEst = Math.round(insuranceEst);
    }

    // 9. Fuel Cost Estimate (Heuristic based on 1000km/month + Fuel Type + Weight)
    let fuelEst = null;
    if (v.fuelType && v.weight?.empty) {
        let consumptionAvg = 7.0; // liters per 100km default
        if (v.weight.empty < 1000) consumptionAvg = 5.5;
        else if (v.weight.empty > 1500) consumptionAvg = 8.5;
        else if (v.weight.empty > 2000) consumptionAvg = 11.0;

        let pricePerUnit = 2.05; // Benzine
        if (v.fuelType === "Diesel") pricePerUnit = 1.75;
        if (v.fuelType === "LPG") pricePerUnit = 0.85;
        if (v.fuelType === "Elektriciteit") {
            consumptionAvg = 18; // kWh per 100km
            pricePerUnit = 0.40; // Price per kWh
        }

        fuelEst = Math.round((1000 / 100) * consumptionAvg * pricePerUnit);
    }

    // 10. Known Issues (Mocked heuristics)
    const knownIssues = [];
    const brand = (v.brand || "").toUpperCase();
    if (ageInMonths && ageInMonths > (10 * 12)) {
        if (brand.includes("TOYOTA")) {
            knownIssues.push({
                title: "Timing chain wear", severity: "Moderate", target: "Older VVT-i engines", advice: "Check for rattling noises during cold start."
            });
        }
        if (brand.includes("VOLKSWAGEN") || brand.includes("AUDI")) {
            knownIssues.push({
                title: "Oil consumption TFSI", severity: "High", target: "1.8 and 2.0 engines (2008-2012)", advice: "Ask for oil consumption history."
            });
        }
        knownIssues.push({
            title: "Clutch issues", severity: "Common", target: "All years", advice: "Check for wear during test drive."
        });
    }

    return {
        ageInMonths,
        ageString,
        isImported,
        maintenanceRiskScore: Number(riskScore.toFixed(1)),
        estimatedValueNow: valNow,
        estimatedValueNextYear: valNextYear,
        apkPassChance: passChance,
        repairChances,
        roadTaxEstQuarter: tax,
        insuranceEstMonth: insuranceEst,
        fuelEstMonth: fuelEst,
        knownIssues
    };
}
