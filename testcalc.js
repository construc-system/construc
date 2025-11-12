
import { calculateBalok } from "./calc-balok.js";

const testData = {
  module: "balok",
  mode: "evaluasi",
  dimensi: { h: "2", b: "2", sb: "2" },
  beban: {
    left: { mu_pos: "3", mu_neg: "3", vu: "3", tu: "3" },
    center: { mu_pos: "3", mu_neg: "3", vu: "3", tu: "3" },
    right: { mu_pos: "3", mu_neg: "3", vu: "3", tu: "3" },
  },
  material: { fc: "1", fy: "1", fyt: "1" },
  lanjutan: { lambda: "5", n: "5" },
  tulangan: {
    d: "4", phi: "4",
    support: { n: "4", np: "4", nt: "4", s: "4" },
    field: { n: "4", np: "4", nt: "4", s: "4" }
  }
};

const result = calculateBalok(testData);
console.log(JSON.stringify(result, null, 2));
