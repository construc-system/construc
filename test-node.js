// Simulasikan environment browser untuk Node.js
global.window = global;
global.sessionStorage = {
  setItem: () => {},
  getItem: () => null
};

// Load calc-balok.js
require('./calc-balok.js');

// Jalankan test
const { runTests, testKontrolDetails } = require('./test-calc-balok.js');

console.log("🚀 TESTING DI NODE.JS");
runTests();
testKontrolDetails();