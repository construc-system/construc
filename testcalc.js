
import { calculateBalok } from "./calc-balok.js";

const testData = {
  module: "balok",
  mode: "desain",
  dimensi: { h: "400", b: "250", sb: "40" },
  beban: {
    left: { mu_pos: "36.49", mu_neg: "94", vu: "83.242", tu: "20" },
    center: { mu_pos: "40.65", mu_neg: "0", vu: "83.242", tu: "20" },
    right: { mu_pos: "65.92", mu_neg: "110.03", vu: "83.242", tu: "20" },
  },
  material: { fc: "20", fy: "300", fyt: "300" },
  lanjutan: {},
};

const result = calculateBalok(testData);
console.log(JSON.stringify(result, null, 2));
