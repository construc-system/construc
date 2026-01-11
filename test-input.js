// [file name]: test-inputs.js
// ======================================================================
// test-inputs.js — Data test untuk semua modul
// ======================================================================

// DATA BALOK - STRUKTUR DIPERBAIKI
const dataBalokDesain = {
  "module": "balok",
  "mode": "desain",
  "dimensi": {
    "h": "400",
    "b": "250",
    "sb": "40"
  },
  "beban": {
    "left": {
      "mu_pos": "36.49",
      "mu_neg": "94",
      "vu": "100",
      "tu": "20"
    },
    "center": {
      "mu_pos": "40.65",
      "mu_neg": "0",
      "vu": "100",
      "tu": "20"
    },
    "right": {
      "mu_pos": "65.92",
      "mu_neg": "110.03",
      "vu": "100",
      "tu": "20"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1",
    "n": "2"
  }
};

const dataBalokEvaluasi = {
  "module": "balok",
  "mode": "evaluasi",
  "dimensi": {
    "h": "400",
    "b": "250",
    "sb": "40"
  },
  "beban": {
    "left": {
      "mu_pos": "36.49",
      "mu_neg": "94",
      "vu": "83.242",
      "tu": "20"
    },
    "center": {
      "mu_pos": "40.65",
      "mu_neg": "0",
      "vu": "83.242",
      "tu": "20"
    },
    "right": {
      "mu_pos": "65.92",
      "mu_neg": "110.03",
      "vu": "83.242",
      "tu": "20"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1",
    "n": "2"
  },
  "tulangan": {
    "d": "19",
    "phi": "6",
    "support": {
      "n": "6",
      "np": "3",
      "nt": "4",
      "s": "100"
    },
    "field": {
      "n": "3",
      "np": "3",
      "nt": "4",
      "s": "100"
    }
  }
};

// DATA KOLOM - STRUKTUR DIPERBAIKI
const dataKolomDesain = {
  "module": "kolom",
  "mode": "desain",
  "dimensi": {
    "h": "700",
    "b": "600",
    "sb": "40"
  },
  "beban": {
    "pu": "1200",
    "mu": "650",
    "vu": "274.29"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1",
    "n_kaki": "2"
  },
  "tulangan": {}
};

const dataKolomEvaluasi = {
  "module": "kolom",
  "mode": "evaluasi",
  "dimensi": {
    "h": "700",
    "b": "600",
    "sb": "40"
  },
  "beban": {
    "pu": "1200",
    "mu": "650",
    "vu": "274.29"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "fyt": "300"
  },
  "lanjutan": {
    "lambda": "1",
    "n_kaki": "2"
  },
  "tulangan": {
    "d": "29",
    "phi": "10",
    "n": "12",
    "s": "220"
  }
};

// DATA PELAT - SEMUA VARIASI MODE
const dataPelatDesainAuto = {
  "module": "pelat",
  "mode": "desain",
  "dimensi": {
    "ly": "6",
    "lx": "4",
    "h": "120",
    "sb": "20"
  },
  "beban": {
    "mode": "auto",
    "auto": {
      "qu": "10",
      "tumpuan_type": "Terjepit Penuh",
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "12.16"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300"
  },
  "lanjutan": {},
  "tulangan": {}
};

const dataPelatDesainManual = {
  "module": "pelat",
  "mode": "desain",
  "dimensi": {
    "ly": "5",
    "lx": "3",
    "h": "150",
    "sb": "25"
  },
  "beban": {
    "mode": "manual",
    "auto": {
      "qu": "0",
      "tumpuan_type": "",
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "15.5"
    }
  },
  "material": {
    "fc": "25",
    "fy": "400"
  },
  "lanjutan": {
    "lambda": "1"
  },
  "tulangan": {}
};

const dataPelatEvaluasiAuto = {
  "module": "pelat",
  "mode": "evaluasi",
  "dimensi": {
    "ly": "6",
    "lx": "4",
    "h": "120",
    "sb": "20"
  },
  "beban": {
    "mode": "auto",
    "auto": {
      "qu": "10",
      "tumpuan_type": "Terjepit Penuh",
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "12.16"
    }
  },
  "material": {
    "fc": "20",
    "fy": "300"
  },
  "lanjutan": {},
  "tulangan": {
    "d": "10",
    "db": "8",
    "s": "155",
    "sb": "200"
  }
};

const dataPelatEvaluasiManual = {
  "module": "pelat",
  "mode": "evaluasi",
  "dimensi": {
    "ly": "5",
    "lx": "3",
    "h": "150",
    "sb": "25"
  },
  "beban": {
    "mode": "manual",
    "auto": {
      "qu": "0",
      "tumpuan_type": "",
      "pattern_binary": "0000"
    },
    "manual": {
      "mu": "15.5"
    }
  },
  "material": {
    "fc": "25",
    "fy": "400"
  },
  "lanjutan": {
    "lambda": "1"
  },
  "tulangan": {
    "d": "13",
    "db": "10",
    "s": "175",
    "sb": "225"
  }
};

// ======================================================================
// DATA FONDASI - STRUKTUR BARU SESUAI PERUBAHAN
// ======================================================================

// FONDASI TUNGGAL BUJUR SANGKAR - MODE DESAIN
const dataFondasiBujurSangkarDesain = {
  "module": "fondasi",
  "mode": "desain",
  "fondasi": {
    "mode": "bujur_sangkar",
    "autoDimensi": false,
    "dimensi": {
      "ly": "2.8",
      "lx": "2.8",
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.68",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "254",
    "muy": "15"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {}
};

// FONDASI TUNGGAL PERSEGI PANJANG - MODE DESAIN
const dataFondasiPersegiPanjangDesain = {
  "module": "fondasi",
  "mode": "desain",
  "fondasi": {
    "mode": "persegi_panjang",
    "autoDimensi": true,
    "dimensi": {
      "ly": "2.8",
      "lx": "2",
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.68",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "254",
    "muy": "15"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {}
};

// FONDASI MENERUS - MODE DESAIN
const dataFondasiMenerusDesain = {
  "module": "fondasi",
  "mode": "desain",
  "fondasi": {
    "mode": "menerus",
    "autoDimensi": false,
    "dimensi": {
      "ly": "13.5",
      "lx": "1.6",
      "by": "13500",
      "bx": "500",
      "h": "0.25",
      "alpha_s": "100"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "1800",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {}
};

// FONDASI BUJUR SANGKAR - MODE EVALUASI
const dataFondasiBujurSangkarEvaluasi = {
  "module": "fondasi",
  "mode": "evaluasi",
  "fondasi": {
    "mode": "bujur_sangkar",
    "autoDimensi": false,
    "dimensi": {
      "ly": "2.8",
      "lx": "2.8",
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {},
  "tulangan": {
    "d": "19",
    "s": "100"
  }
};

// FONDASI PERSEGI PANJANG - MODE EVALUASI
const dataFondasiPersegiPanjangEvaluasi = {
  "module": "fondasi",
  "mode": "evaluasi",
  "fondasi": {
    "mode": "persegi_panjang",
    "autoDimensi": false,
    "dimensi": {
      "ly": "2.8",
      "lx": "2",
      "by": "400",
      "bx": "400",
      "h": "0.4",
      "alpha_s": "30"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "384",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {},
  "tulangan": {
    "d": "19",
    "db": "16",
    "s": "100",
    "sp": "100",
    "st": "100"
  }
};

// FONDASI MENERUS - MODE EVALUASI
const dataFondasiMenerusEvaluasi = {
  "module": "fondasi",
  "mode": "evaluasi",
  "fondasi": {
    "mode": "menerus",
    "autoDimensi": false,
    "dimensi": {
      "ly": "13.5",
      "lx": "1.6",
      "by": "13500",
      "bx": "500",
      "h": "0.25",
      "alpha_s": "100"
    }
  },
  "tanah": {
    "mode": "manual",
    "auto": {
      "df": "1.6",
      "gamma": "17.2",
      "terzaghi": true,
      "phi": "34",
      "c": "20",
      "mayerhoff": true,
      "qc": "95"
    },
    "manual": {
      "qa": "489.6",
      "df": "1.6",
      "gamma": "17.2"
    }
  },
  "beban": {
    "pu": "1800",
    "mux": "251",
    "muy": "0"
  },
  "material": {
    "fc": "20",
    "fy": "300",
    "gammaC": "24"
  },
  "lanjutan": {},
  "tulangan": {
    "d": "19",
    "db": "16",
    "s": "95",
    "sb": "100"
  }
};

// Export semua data
module.exports = {
  dataBalokDesain,
  dataBalokEvaluasi,
  dataKolomDesain,
  dataKolomEvaluasi,
  dataPelatDesainAuto,
  dataPelatDesainManual,
  dataPelatEvaluasiAuto,
  dataPelatEvaluasiManual,
  dataFondasiBujurSangkarDesain,
  dataFondasiPersegiPanjangDesain,
  dataFondasiMenerusDesain,
  dataFondasiBujurSangkarEvaluasi,
  dataFondasiPersegiPanjangEvaluasi,
  dataFondasiMenerusEvaluasi
};