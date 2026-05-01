"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const mapper_1 = require("../lib/rdw/mapper");
(0, node_test_1.default)("toVehicleProfile maps key fields and raw payloads", () => {
    const profile = (0, mapper_1.toVehicleProfile)({
        plate: "16RSL9",
        fromCache: false,
        main: [
            {
                merk: "TOYOTA",
                handelsbenaming: "YARIS",
                datum_eerste_toelating: "20130426",
                vervaldatum_apk: "20270426"
            }
        ],
        fuel: [{ brandstof_omschrijving: "Benzine" }],
        apk: [{ keuringsresultaat: "goedgekeurd" }],
        defects: [{ gebrek_identificatienummer: "ABC123" }],
        recalls: [{ referentiecode_rdweu: "R1" }],
        body: [{ carrosserietype: "hatchback" }],
        typeApprovals: []
    });
    strict_1.default.equal(profile.plate, "16RSL9");
    strict_1.default.equal(profile.displayPlate, "16-RSL-9");
    strict_1.default.equal(profile.vehicle.brand, "TOYOTA");
    strict_1.default.equal(profile.vehicle.tradeName, "YARIS");
    strict_1.default.equal(profile.vehicle.year, 2013);
    strict_1.default.equal(profile.vehicle.fuelType, "Benzine");
    strict_1.default.equal(profile.vehicle.apkExpiryDate, "2027-04-26");
    strict_1.default.equal(profile.vehicle.recallsCount, 1);
    strict_1.default.equal(profile.inspections.length, 1);
    strict_1.default.equal(profile.defects.length, 1);
    strict_1.default.equal(profile.recalls.length, 1);
    strict_1.default.equal(profile.raw.main.length, 1);
    strict_1.default.equal(profile.raw.fuel.length, 1);
    strict_1.default.equal(profile.raw.apk.length, 1);
    strict_1.default.equal(profile.raw.defects.length, 1);
    strict_1.default.equal(profile.raw.recalls.length, 1);
    strict_1.default.equal(profile.raw.body.length, 1);
    strict_1.default.equal(profile.raw.typeApprovals.length, 0);
});
