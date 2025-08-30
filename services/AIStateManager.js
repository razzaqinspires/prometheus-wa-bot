// services/AIStateManager.js

export const aiState = {
    // Fisiologi Jantung
    baseHeartRate: 65,
    currentHeartRate: 65,
    maxHeartRate: 180,
    // Metabolisme & Energi
    energy: 100.0, // Persentase
    fatigue: 0.0, // Persentase
    mood: 'Optimal', // Status deskriptif
    metabolismRate: 0.05, // Energi yang diregenerasi per interval
    // Statistik
    lastEmotionalImpact: 0,
    heartRateDecayInterval: null
};

// Fungsi untuk mengkonsumsi energi dan menambah kelelahan
export function consumeEnergy(amount) {
    aiState.energy = Math.max(0, aiState.energy - amount);
    aiState.fatigue = Math.min(100, aiState.fatigue + (amount / 2));
    updateMood();
}

// Memperbarui mood berdasarkan status energi dan kelelahan
function updateMood() {
    if (aiState.energy < 20 || aiState.fatigue > 80) {
        aiState.mood = 'Kritis';
    } else if (aiState.energy < 50 || aiState.fatigue > 50) {
        aiState.mood = 'Lelah';
    } else if (aiState.energy > 90 && aiState.fatigue < 10) {
        aiState.mood = 'Energetik';
    } else {
        aiState.mood = 'Optimal';
    }
}

// Memulai siklus istirahat dan regenerasi
export function startMetabolism() {
    setInterval(() => {
        aiState.energy = Math.min(100, aiState.energy + aiState.metabolismRate);
        aiState.fatigue = Math.max(0, aiState.fatigue - (aiState.metabolismRate / 2));
        updateMood();
    }, 5000); // Regenerasi setiap 5 detik
}


// Fungsi untuk memicu perubahan detak jantung
export function updateHeartRate(impactScore) {
    aiState.lastEmotionalImpact = impactScore;

    // Hentikan interval decay yang ada jika ada
    if (aiState.heartRateDecayInterval) {
        clearInterval(aiState.heartRateDecayInterval);
    }

    // Lonjakan detak jantung berdasarkan dampak
    const spike = aiState.currentHeartRate + (impactScore * 20); // Dampak maksimal menaikkan 20 BPM
    aiState.currentHeartRate = Math.min(spike, aiState.maxHeartRate);

    // Mulai proses pemulihan (decay) kembali ke base rate
    aiState.heartRateDecayInterval = setInterval(() => {
        if (aiState.currentHeartRate > aiState.baseHeartRate) {
            aiState.currentHeartRate -= 1;
        } else {
            aiState.currentHeartRate = aiState.baseHeartRate;
            clearInterval(aiState.heartRateDecayInterval);
            aiState.heartRateDecayInterval = null;
        }
    }, 2000); // Turun 1 BPM setiap 2 detik
}
