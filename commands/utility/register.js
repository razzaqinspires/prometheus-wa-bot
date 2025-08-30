// commands/utility/register.js (V2.3 - Real-time State Synchronization)
// Peningkatan: Memastikan data pengguna baru langsung disinkronkan
// ke state memori bot setelah berhasil disimpan ke disk.

import fs from 'fs/promises';

const DB_PATH = './data/registeredUsers.json';

// Helper tetap sama
async function readDB(logger) {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(DB_PATH, '{}');
            return {};
        }
        logger.error({ err: error }, "Gagal membaca database registrasi.");
        throw error;
    }
}

async function writeDB(data, logger) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        logger.error({ err: error }, "Gagal menyimpan database registrasi.");
        throw error;
    }
}


// === Tahapan Sesi ===

async function startRegistration(context) {
    const { sock, m, stateManager } = context;
    const question = "📝 *Protokol Registrasi Dinisialisasi*\n\nSilakan balas pesan ini dengan nama lengkap Anda.";
    const sentMsg = await m.reply(question);

    const session = {
        command: 'register',
        step: 'ask_name',
        answers: {},
        messageId: sentMsg.key.id,
        timeout: setTimeout(() => {
            if (stateManager.state.activeSessions.has(m.sender)) {
                stateManager.state.activeSessions.delete(m.sender);
                sock.sendMessage(m.from, { text: '[SISTEM] Sesi registrasi berakhir karena waktu habis.' });
            }
        }, 60 * 1000)
    };
    stateManager.state.activeSessions.set(m.sender, session);
}

async function handleNameReply(context) {
    const { m, session } = context;
    const name = m.text.trim();
    if (!name || name.length > 50) {
        return m.reply('[VALIDASI] Nama tidak valid. Harap masukkan nama yang benar (maksimal 50 karakter).');
    }
    session.answers.name = name;
    await handleAgePrompt(context); // Lanjut ke pertanyaan usia
}

async function handleAgePrompt(context) {
    const { sock, m, session, stateManager } = context;
    session.step = 'ask_age';
    const question = `👤 Identitas nama diterima: *${session.answers.name}*\n\nSekarang, silakan balas dengan usia Anda (hanya angka).`;
    const sentMsg = await m.reply(question);
    session.messageId = sentMsg.key.id;
    stateManager.state.activeSessions.set(m.sender, session); // Perbarui sesi
}


async function handleAgeReply(context) {
    const { m, session, stateManager, logger } = context;
    const age = parseInt(m.text.trim(), 10);
    if (isNaN(age) || age < 13 || age > 100) {
        return m.reply('[VALIDASI] Usia tidak valid. Harap masukkan usia yang wajar (antara 13 dan 100 tahun).');
    }
    session.answers.age = age;
    await m.reply(`🎂 Verifikasi usia berhasil: *${age} tahun*.\n\nMemproses pendaftaran Anda...`);

    try {
        const db = await readDB(logger);
        const newUser = {
            name: session.answers.name,
            age: session.answers.age,
            registeredAt: new Date().toISOString()
        };
        db[m.sender] = newUser;

        // 1. Tulis ke file (Persisten)
        await writeDB(db, logger);

        // [PERBAIKAN KRITIS] 2. Perbarui state di memori (Live)
        stateManager.state.registeredUsers[m.sender] = newUser;
        logger.info(`[STATE_SYNC] Pengguna baru ${m.sender} telah disinkronkan ke memori.`);

        await m.reply(`✅ *Registrasi Berhasil!*\n\nSelamat datang di jaringan Prometheus, *${session.answers.name}*. Identitas Anda telah diverifikasi dan disimpan.`);

    } catch (error) {
        await m.reply('[SISTEM] Terjadi anomali internal saat menyimpan data Anda. Pendaftaran gagal.');
    } finally {
        clearTimeout(session.timeout);
        stateManager.state.activeSessions.delete(m.sender);
    }
}

// --- Objek Perintah Utama ---
export default {
    name: 'register',
    aliases: ['reg', 'daftar'],
    category: 'Utility',
    description: 'Mendaftarkan pengguna ke dalam basis data bot.',
    allowDuringSession: true, // Izinkan perintah ini berjalan bahkan saat sesi lain aktif

    async execute(context) {
        const { m, stateManager } = context;
        const activeSession = stateManager.state.activeSessions.get(m.sender);

        if (activeSession && activeSession.command === 'menu') {
            await activeSession.stop();
            await m.reply("[SISTEM] Sesi menu aktif telah dihentikan untuk memulai registrasi.");
        } else if (activeSession) {
            return m.reply(`[SISTEM] Anda sedang dalam sesi aktif lain (\`${activeSession.command}\`).`);
        }

        await startRegistration(context);
    },

    async onReply(context) {
        const { session } = context;
        switch (session.step) {
            case 'ask_name':
            await handleNameReply(context);
            break;
            case 'ask_age':
            await handleAgeReply(context);
            break;
            default:
            await context.m.reply('[SISTEM] Terjadi kesalahan pada status sesi. Sesi dihentikan.');
            context.stateManager.state.activeSessions.delete(context.m.sender);
            break;
        }
    }
};
