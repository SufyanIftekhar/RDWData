import test from "node:test";
import assert from "node:assert/strict";
import { toVehicleProfile } from "../lib/rdw/mapper";

test("toVehicleProfile maps key fields and raw payloads", () => {
  const profile = toVehicleProfile({
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

  assert.equal(profile.plate, "16RSL9");
  assert.equal(profile.displayPlate, "16-RSL-9");
  assert.equal(profile.vehicle.brand, "TOYOTA");
  assert.equal(profile.vehicle.tradeName, "YARIS");
  assert.equal(profile.vehicle.year, 2013);
  assert.equal(profile.vehicle.fuelType, "Benzine");
  assert.equal(profile.vehicle.apkExpiryDate, "2027-04-26");
  assert.equal(profile.vehicle.recallsCount, 1);
  assert.equal(profile.inspections.length, 1);
  assert.equal(profile.defects.length, 1);
  assert.equal(profile.recalls.length, 1);
  assert.equal(profile.raw.main.length, 1);
  assert.equal(profile.raw.fuel.length, 1);
  assert.equal(profile.raw.apk.length, 1);
  assert.equal(profile.raw.defects.length, 1);
  assert.equal(profile.raw.recalls.length, 1);
  assert.equal(profile.raw.body.length, 1);
  assert.equal(profile.raw.typeApprovals.length, 0);
});
