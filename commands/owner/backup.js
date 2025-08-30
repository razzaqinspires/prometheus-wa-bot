// commands/owner/backup.js (V3.0 - Fully Context-Driven & Resilient)
// Peningkatan: Seluruh file direfaktorisasi untuk menggunakan satu objek 'context'
// yang konsisten, menghilangkan bug referensi dan meningkatkan modularitas.

import { createBackup } from '../../services/BackupManager.js';
import fs from 'fs/promises';
import path from 'path'; // [PERBAIKAN] Impor modul 'path' yang hilang

// --- Helper Functions yang Diperbarui untuk Menerima 'context' ---

async function startBackupSession(context) {
    const { sock, m, stateManager } = context;
    const question = `Protokol Backup Dinisialisasi.\n\nApakah Anda ingin menyertakan file sesi (creds.json)?\n\nBalas pesan ini dengan *'ya'* atau *'tidak'*.`;
    const sentMsg = await m.reply(question);

    const session = {
        command: 'backup',
        step: 'ask_session',
        answers: {},
        messageId: sentMsg.key.id,
        expiresAt: Date.now() + 60 * 1000,
        timeout: setTimeout(() => {
            if (stateManager.state.activeSessions.has(m.sender)) {
                stateManager.state.activeSessions.delete(m.sender);
                sock.sendMessage(m.from, { text: '[SISTEM] Sesi backup telah berakhir karena waktu habis.' });
            }
        }, 60 * 1000)
    };
    stateManager.state.activeSessions.set(m.sender, session);
}

async function handleAskCleanCode(context) {
    const { sock, m, session } = context;
    const question = `Konfigurasi sesi diterima.\n\nApakah Anda ingin membersihkan kode (hapus komentar & rapikan) sebelum backup?\n\nBalas pesan ini dengan *'ya'* atau *'tidak'*.`;
    const sentMsg = await m.reply(question);
    session.step = 'ask_clean';
    session.messageId = sentMsg.key.id;
}

async function executeBackup(context) {
    const { sock, m, session, stateManager, config, logger } = context;
    await m.reply('[SISTEM] Konfigurasi akhir diterima. Memulai proses pengarsipan. Harap tunggu...');
    try {
        const backupPath = await createBackup(session.answers);
        await sock.sendMessage(m.from, {
            document: await fs.readFile(backupPath), // Gunakan readFile untuk buffer
            mimetype: 'application/zip',
            // [PERBAIKAN] 'path' sekarang terdefinisi karena sudah diimpor
            fileName: path.basename(backupPath)
        });
        await fs.unlink(backupPath); // Hapus file setelah dikirim
    } catch (error) {
        logger.error({ err: error }, "[BACKUP] Gagal membuat arsip backup.");
        // [PERBAIKAN] 'config' sekarang terdefinisi dari context
        const ownerJid = (config.ownerNumbers[0] || '6288804074510') + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, { text: `[ANOMALI BACKUP] Gagal membuat arsip: ${error.message}`});
        await m.reply('[SISTEM] Terjadi anomali kritis saat membuat arsip. Laporan telah dikirim ke pusat komando.');
    } finally {
        stateManager.state.activeSessions.delete(m.sender);
    }
}


// --- Objek Perintah Utama ---

export default {
    name: 'backup',
    category: 'Owner',
    description: 'Membuat arsip backup dari seluruh basis kode bot.',
    permission: {
        restriction: ['owner']
    },

    async execute(context) {
        const { m, stateManager } = context;
        if (stateManager.state.activeSessions.has(m.sender)) {
            return m.reply('[SISTEM] Anda sudah memiliki sesi aktif. Selesaikan atau batalkan terlebih dahulu.');
        }
        await startBackupSession(context);
    },

    async onReply(context) {
        const { m, session } = context;
        const reply = m.text.toLowerCase().trim();
        const validReplies = ['ya', 'tidak'];

        if (!validReplies.includes(reply)) {
            return m.reply(`[SISTEM] Input tidak valid. Harap balas dengan 'ya' atau 'tidak'.`);
        }

        clearTimeout(session.timeout); // Hentikan timeout segera setelah ada balasan valid

        if (session.step === 'ask_session') {
            session.answers.includeSession = (reply === 'ya');
            await handleAskCleanCode(context);
        } else if (session.step === 'ask_clean') {
            session.answers.cleanCode = (reply === 'ya');
            await executeBackup(context);
        }
    }
};
