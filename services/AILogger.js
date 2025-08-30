// services/AILogger.js (BARU)

import fs from 'fs';
const LOG_PATH = './data/ai_consciousness_log.txt';

function log(entry) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${entry}\n`;
    fs.appendFileSync(LOG_PATH, logMessage);
}

export default {
    logDecision: (prompt, history, providers) => {
        log(`[KOGNISI] Menerima prompt. Riwayat: ${history.length} pesan. Mempertimbangkan provider: ${providers.map(p => p.id).join(', ')}.`);
    },
    logResponse: (providerId, responseSnippet) => {
        log(`[RESPONS] Berhasil mendapat respons dari ${providerId.toUpperCase()}. Snippet: "${responseSnippet}..."`);
    },
    logFallback: (reason) => {
        log(`[FALLBACK] Gagal mendapat respons dari semua provider. Alasan: ${reason}.`);
    },
    logImpact: (userImpact, aiImpact, newHeartRate) => {
        log(`[EMOSI] Dampak emosional terdeteksi. User: ${userImpact.toFixed(2)}, AI: ${aiImpact.toFixed(2)}. Detak jantung baru: ${newHeartRate} BPM.`);
    }
};
