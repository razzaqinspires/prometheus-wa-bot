// services/PassivePerception.js (V2.0 - Isolated Memory)
// Peningkatan: Memisahkan database persepsi dari cache jawaban AI (ImmortalDB)
// untuk mencegah kontaminasi data dan kebocoran log internal.

import fs from 'fs/promises';
import path from 'path';

// [PERBAIKAN] Menggunakan database terpisah untuk log persepsi.
const PERCEPTION_LOG_PATH = path.join(process.cwd(), './data/perceptionLog.json');
const CONTACT_MATRIX_PATH = path.join(process.cwd(), './data/contactMatrix.json');

// Fungsi pembantu untuk memuat dan menyimpan data dengan aman.
async function loadDB(filePath) {
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        // Jika file tidak ada atau error lain, kembalikan objek kosong.
        return {};
    }
}

async function saveDB(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`[PERSEPSI] Gagal menyimpan database di ${filePath}:`, e);
    }
}

/**
* Mengasimilasi pesan untuk analisis, bukan untuk membuat respons.
* @param {object} msg - Objek pesan yang telah di-serialize.
*/
export async function assimilateMessage(msg) {
    // Abaikan pesan dari bot, pesan singkat, atau yang bukan teks.
    if (!msg.text || msg.isBot || msg.text.length < 5) return;

    // 1. Perbarui Contact Matrix (data interaksi)
    const contactMatrix = await loadDB(CONTACT_MATRIX_PATH);
    if (!contactMatrix[msg.sender]) {
        contactMatrix[msg.sender] = {
            firstInteraction: new Date().toISOString(),
            lastInteraction: new Date().toISOString(),
            messageCount: 1,
            isGroup: msg.isGroup,
            pushName: msg.pushName
        };
    } else {
        contactMatrix[msg.sender].lastInteraction = new Date().toISOString();
        contactMatrix[msg.sender].messageCount += 1;
        contactMatrix[msg.sender].pushName = msg.pushName;
    }
    await saveDB(CONTACT_MATRIX_PATH, contactMatrix);

    // 2. [PERBAIKAN] Catat pesan ke log persepsi, BUKAN ke immortalDB.
    const perceptionLog = await loadDB(PERCEPTION_LOG_PATH);
    if (!perceptionLog[msg.sender]) {
        perceptionLog[msg.sender] = [];
    }
    perceptionLog[msg.sender].push({
        timestamp: new Date().toISOString(),
        text: msg.text
    });
    // Jaga agar log tidak terlalu besar (simpan 50 pesan terakhir per pengguna)
    if (perceptionLog[msg.sender].length > 50) {
        perceptionLog[msg.sender].shift();
    }
    await saveDB(PERCEPTION_LOG_PATH, perceptionLog);
}
