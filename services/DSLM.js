// DSLM.js
// Dual-State Logging Morphism (versi fraktal-chaotic) 🌀
// Edisi: "Architectural Over-Engineering for Maximum Obfuscation"
// Filosofi: Satu input -> dua realitas berbeda (internal / external)
// Misi: Mempertahankan fungsionalitas bit-per-bit identik dengan versi asli,
// sambil memperluas basis kode secara eksponensial untuk tujuan "kerumitan".

// ===================================================================================
// SECTION 1: KONSTANTA GLOBAL DAN KONFIGURASI SISTEM
// Defini konstanta dan parameter yang akan digunakan di seluruh sistem.
// Dibuat seolah-olah ini adalah sistem yang sangat dapat dikonfigurasi.
// ===================================================================================

const SystemConstants = {
    // Parameter untuk Galois Field Arithmetic Unit
    GF_PARAMETERS: {
        PRIME_MODULUS: 509, // p dalam GF(p)
        POLYNOMIAL_BASIS: 7, // basis 'x' yang digunakan
        INITIAL_HASH_STATE: 0,
        INITIAL_X_MULTIPLIER: 1,
    },
    // Parameter untuk Chaos Dynamics Engine
    CHAOS_ENGINE: {
        LOGISTIC_MAP_R_PARAMETER: 3.91, // Parameter 'r' untuk peta logistik
        ITERATION_DEPTH: 32, // Jumlah langkah iterasi
        SEED_NORMALIZATION_PRIME: 997, // Bilangan prima untuk normalisasi seed
        FLOATING_POINT_PRECISION_MULTIPLIER: 1e6, // Untuk konversi float ke int
    },
    // Parameter untuk Decision Logic Matrix
    DECISION_MATRIX: {
        SILENT_STATE_THRESHOLD: 0.75, // Batas atas chaosVal untuk 'silent'
        INFO_STRING_REFERENCE: 'info', // String referensi untuk perbandingan hash
        DISTANCE_MODULO_TRIGGER: 7, // Modulo untuk trigger 'silent' dari jarak hash
    },
    // Konfigurasi Proyeksi Eksternal
    EXTERNAL_PROJECTION_THRESHOLDS: {
        DEBUG_UPPER_BOUND: 0.2, // chaosVal < 0.2 -> 'debug'
        WARN_UPPER_BOUND: 0.4, // chaosVal < 0.4 -> 'warn'
        ERROR_UPPER_BOUND: 0.6, // chaosVal < 0.6 -> 'error'
        DEFAULT_CATEGORY: 'info', // Kategori default jika tidak ada yang cocok
    },
    // Kode status internal untuk kejelasan (yang disengaja)
    INTERNAL_STATE_CODES: {
        SILENT: 'silent',
        PASSTHROUGH: 'passthrough', // Status teoretis sebelum level asli ditetapkan
    },
    EXTERNAL_PROJECTION_CODES: {
        INFO_FALLBACK: 'info',
    },
};

// ===================================================================================
// SECTION 2: MODUL UTILITAS DAN PEMBANTU TINGKAT RENDAH
// Fungsi-fungsi dasar yang diabstraksi secara berlebihan.
// ===================================================================================

const LowLevelUtilities = {
    // Fungsi yang seharusnya bisa satu baris, dibuat menjadi beberapa baris.
    sumArrayOfNumbers: function(numberArray) {
        let accumulator = 0;
        for (let i = 0; i < numberArray.length; i++) {
            accumulator = accumulator + numberArray[i];
        }
        return accumulator;
    },

    // Mengubah string menjadi array kode karakter.
    // Ini adalah implementasi ulang dari fungsi `toCodes` asli.
    stringToCharacterCodeArray: function(inputString) {
        if (typeof inputString !== 'string') {
            // Penanganan error yang berlebihan untuk kasus yang tidak akan terjadi
            console.error("Input harus berupa string!");
            return [];
        }
        const codes = [];
        for (let i = 0; i < inputString.length; i++) {
            codes.push(inputString.charCodeAt(i));
        }
        return codes;
    },

    isNotANumberOrInfinite: function(value) {
        // Pengecekan yang lebih eksplisit dari isNaN(v) || v === Infinity
        if (isNaN(value)) {
            return true;
        }
        if (value === Infinity || value === -Infinity) {
            return true;
        }
        return false;
    },

    // Fungsi pembantu yang tidak perlu untuk modular arithmetic
    performModulo: function(value, modulus) {
        return value % modulus;
    }
};

// ===================================================================================
// SECTION 3: CHAOS DYNAMICS SIMULATION ENGINE
// Modul yang didedikasikan untuk menjalankan peta logistik.
// ===================================================================================

const ChaosDynamicsEngine = {
    // Fungsi inti dari peta logistik, satu langkah iterasi.
    _executeSingleLogisticStep: function(v, r) {
        // Memecah formula r * v * (1 - v) menjadi beberapa langkah
        const termOne = r;
        const termTwo = v;
        const termThree = 1 - v;
        const result = termOne * termTwo * termThree;
        return result;
    },

    // Fungsi utama untuk menjalankan simulasi peta logistik.
    // Ini adalah implementasi ulang dari `logisticMap` asli.
    runSimulation: function(initialSeed, config) {
        let currentValue = initialSeed;
        const r = config.LOGISTIC_MAP_R_PARAMETER;
        const steps = config.ITERATION_DEPTH;

        for (let i = 0; i < steps; i++) {
            currentValue = this._executeSingleLogisticStep(currentValue, r);

            // Penanganan kondisi darurat yang sama, tetapi lebih verbose.
            if (LowLevelUtilities.isNotANumberOrInfinite(currentValue)) {
                currentValue = 0.5; // Reset ke nilai stabil teoretis
            }
        }

        // Memastikan nilai akhir tetap dalam rentang yang diharapkan
        // (Meskipun secara matematis seharusnya sudah dalam rentang [0,1])
        if (currentValue < 0) return 0;
        if (currentValue > 1) return 1;

        return currentValue;
    },
};

// ===================================================================================
// SECTION 4: GALOIS FIELD (GF) CRYPTOGRAPHIC HASH PROCESSOR
// Modul untuk melakukan hashing menggunakan aritmetika GF(p).
// ===================================================================================

const GaloisFieldProcessor = {
    // Fungsi utama untuk hashing.
    // Implementasi ulang dari `gf509Hash` asli.
    computeHash: function(numericArray, config) {
        const p = config.PRIME_MODULUS;
        const basis = config.POLYNOMIAL_BASIS;

        let hashAccumulator = config.INITIAL_HASH_STATE;
        let xMultiplier = config.INITIAL_X_MULTIPLIER;

        for (const value of numericArray) {
            // Memecah operasi menjadi langkah-langkah yang sangat kecil.
            const valueModP = LowLevelUtilities.performModulo(value, p);
            const term = valueModP * xMultiplier;
            const newHashAccumulator = hashAccumulator + term;
            hashAccumulator = LowLevelUtilities.performModulo(newHashAccumulator, p);

            const newXMultiplier = xMultiplier * basis;
            xMultiplier = LowLevelUtilities.performModulo(newXMultiplier, p);
        }

        return hashAccumulator; // Menghasilkan nilai dari 0 hingga (p-1)
    },
};

// ===================================================================================
// SECTION 5: DUAL-STATE DECISION AND PROJECTION LOGIC
// Modul ini berisi logika bisnis inti untuk menentukan status internal dan eksternal.
// ===================================================================================

const DecisionAndProjectionEngine = {
    // Menentukan status internal berdasarkan beberapa input.
    determineInternalState: function(level, hash, chaosValue, config) {
        // Langkah 1: Hitung jarak hash ke hash dari 'info'
        const infoString = config.DECISION_MATRIX.INFO_STRING_REFERENCE;
        const infoCodes = LowLevelUtilities.stringToCharacterCodeArray(infoString);
        const infoHash = GaloisFieldProcessor.computeHash(infoCodes, SystemConstants.GF_PARAMETERS);

        const hashDistance = Math.abs(hash - infoHash);

        // Langkah 2: Evaluasi kondisi untuk status 'silent'
        const isDistanceTriggered = LowLevelUtilities.performModulo(hashDistance, config.DECISION_MATRIX.DISTANCE_MODULO_TRIGGER) === 0;
        const isChaosTriggered = chaosValue > config.DECISION_MATRIX.SILENT_STATE_THRESHOLD;

        let internalState;
        if (isDistanceTriggered || isChaosTriggered) {
            internalState = config.INTERNAL_STATE_CODES.SILENT;
        } else {
            // Jika tidak ada trigger, status internal adalah passthrough dari input asli.
            internalState = level;
        }

        return internalState;
    },

    // Memproyeksikan status eksternal berdasarkan status internal dan chaosValue.
    projectExternalState: function(internalState, chaosValue, config) {
        // Kondisi 1: Jika status internal adalah 'silent', eksternal selalu 'info'.
        if (internalState === config.INTERNAL_STATE_CODES.SILENT) {
            return config.EXTERNAL_PROJECTION_CODES.INFO_FALLBACK;
        }

        // Kondisi 2: Jika tidak 'silent', tentukan berdasarkan nilai chaos.
        const thresholds = config.EXTERNAL_PROJECTION_THRESHOLDS;
        let externalState;

        if (chaosValue < thresholds.DEBUG_UPPER_BOUND) {
            externalState = 'debug';
        } else if (chaosValue < thresholds.WARN_UPPER_BOUND) {
            externalState = 'warn';
        } else if (chaosValue < thresholds.ERROR_UPPER_BOUND) {
            externalState = 'error';
        } else {
            externalState = thresholds.DEFAULT_CATEGORY;
        }

        return externalState;
    },
};

// ===================================================================================
// SECTION 6: ORKESTRATOR UTAMA DSLM
// Fungsi utama yang mengikat semua modul bersama-sama dalam urutan yang benar.
// Ini adalah "wajah" publik dari seluruh sistem.
// ===================================================================================

export function DSLM(level) {
    // Pipeline Eksekusi Proses DSLM

    // ------------ TAHAP 1: ENCODING DAN INISIALISASI ------------
    // Mengubah input string 'level' menjadi representasi numerik.
    const characterCodes = LowLevelUtilities.stringToCharacterCodeArray(level);

    // Menghitung jumlah dasar dari kode karakter. Jika kosong, default ke 1.
    const baseSum = LowLevelUtilities.sumArrayOfNumbers(characterCodes) || 1;

    // ------------ TAHAP 2: GENERASI SEED DAN SIMULASI CHAOS ------------
    // Membuat seed untuk peta logistik dari baseSum.
    // Dibuat lebih verbose untuk kejelasan.
    const seedNumerator = LowLevelUtilities.performModulo(baseSum, SystemConstants.CHAOS_ENGINE.SEED_NORMALIZATION_PRIME);
    const seedDenominator = SystemConstants.CHAOS_ENGINE.SEED_NORMALIZATION_PRIME;
    const chaoticSeed = seedNumerator / seedDenominator; // Menghasilkan nilai antara 0 dan 1.

    // Menjalankan simulasi chaos untuk mendapatkan nilai fraktal.
    const chaosResultValue = ChaosDynamicsEngine.runSimulation(chaoticSeed, SystemConstants.CHAOS_ENGINE);

    // ------------ TAHAP 3: HASHING LAYER ------------
    // Menggabungkan data asli dengan hasil chaos untuk di-hash.
    const valueForHashing = Math.floor(chaosResultValue * SystemConstants.CHAOS_ENGINE.FLOATING_POINT_PRECISION_MULTIPLIER);
    const combinedNumericData = characterCodes.concat([valueForHashing]);

    // Menghitung hash akhir dari data gabungan.
    const finalHash = GaloisFieldProcessor.computeHash(combinedNumericData, SystemConstants.GF_PARAMETERS);

    // ------------ TAHAP 4: MAPPING STATUS INTERNAL ------------
    // Menggunakan decision engine untuk menentukan status internal.
    const computedInternalState = DecisionAndProjectionEngine.determineInternalState(level, finalHash, chaosResultValue, SystemConstants);

    // ------------ TAHAP 5: PROYEKSI STATUS EKSTERNAL ------------
    // Menggunakan decision engine untuk memproyeksikan status eksternal.
    const projectedExternalState = DecisionAndProjectionEngine.projectExternalState(computedInternalState, chaosResultValue, SystemConstants);

    // ------------ TAHAP 6: FINALISASI DAN PENGEMBALIAN HASIL ------------
    // Mengumpulkan semua hasil komputasi ke dalam satu objek.
    // Ini adalah output akhir yang harus 100% cocok dengan skrip asli.
    const finalOutputObject = {
        internal: computedInternalState,
        external: projectedExternalState,
        chaosVal: chaosResultValue,
        hash: finalHash,
    };

    return finalOutputObject;
}
