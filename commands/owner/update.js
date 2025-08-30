// commands/owner/update.js (Mekanisme Transplantasi Kode)

import fs from 'fs/promises';
import path from 'path';

const COMMANDS_DIR = './commands';

// --- FUNGSI HELPER ---

/**
* Mengekstrak nama dan kategori dari sebuah blok kode perintah.
* @param {string} code - Kode sumber sebagai string.
* @returns {{name: string|null, category: string|null}}
*/
function extractCommandInfo(code) {
    const nameMatch = code.match(/name\s*:\s*['"]([^'"]+)['"]/);
    const categoryMatch = code.match(/category\s*:\s*['"]([^'"]+)['"]/);
    return {
        name: nameMatch ? nameMatch[1] : null,
        category: categoryMatch ? categoryMatch[1] : null
    };
}

/**
* Mencari file perintah yang ada berdasarkan namanya secara rekursif.
* @param {string} dir - Direktori awal untuk mencari.
* @param {string} commandName - Nama perintah yang dicari.
* @returns {Promise<string|null>} Path lengkap ke file, atau null jika tidak ditemukan.
*/
async function findCommandFile(dir, commandName) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            const result = await findCommandFile(fullPath, commandName);
            if (result) return result;
        } else if (item.name.endsWith('.js')) {
            const content = await fs.readFile(fullPath, 'utf-8');
            const info = extractCommandInfo(content);
            if (info.name === commandName) {
                return fullPath;
            }
        }
    }
    return null;
}

/**
* Merapikan kode JavaScript dengan inden 4 spasi.
* @param {string} code - Kode sumber yang akan dirapikan.
* @returns {string} Kode yang sudah dirapikan.
*/
function formatCode(code) {
    const lines = code.split(/\r?\n/);
    let formattedCode = '';
    let indentLevel = 0;
    const indentSize = '    '; // 4 spasi

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('}') || trimmedLine.startsWith(')') || trimmedLine.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        if (trimmedLine) {
            formattedCode += indentSize.repeat(indentLevel) + trimmedLine + '\n';
        } else {
            formattedCode += '\n'; // Pertahankan baris kosong
        }

        if (trimmedLine.endsWith('{') || trimmedLine.endsWith('(') || trimmedLine.endsWith('[')) {
            indentLevel++;
        }
    }
    return formattedCode.trim();
}

// --- EKSPOR MODUL UTAMA ---

export default {
    name: 'update',
    category: 'Owner',
    description: 'Memperbarui file perintah secara dinamis dengan membalas kode baru.',

    // [PENINGKATAN] Arsitektur perizinan terpusat ditambahkan
    permission: {
        restriction: ['owner'],
        prompt: 'Akses ditolak. Hanya entitas Owner yang dapat melakukan transplantasi kode.'
    },

    async execute(context) {
        // Pemeriksaan 'isOwner' tidak perlu lagi di sini
        const { sock, m, activeSessions } = context;

        if (!m.isQuoted || !m.quoted.text) {
            return m.reply('Perintah ini harus digunakan dengan membalas pesan yang berisi kode lengkap yang ingin diperbarui.');
        }

        const newCode = m.quoted.text;
        const info = extractCommandInfo(newCode);

        if (!info.name) {
            return m.reply('[ANALISIS] Gagal mengekstrak `name` dari kode yang diberikan. Pastikan formatnya benar.');
        }

        const filePath = await findCommandFile(COMMANDS_DIR, info.name);
        if (!filePath) {
            return m.reply(`[ANALISIS] File untuk perintah \`${info.name}\` tidak ditemukan di dalam direktori commands.`);
        }

        // Memulai sesi konfirmasi
        const question = `*Protokol Transplantasi Kode Dinisialisasi*\n\n` +
        `*Target:* \`${filePath}\`\n` +
        `*Perintah:* \`${info.name}\`\n\n` +
        `Apakah Anda ingin merapikan kode secara otomatis (inden 4 spasi) sebelum memperbarui?\n\n` +
        `Balas pesan ini dengan *'ya'* atau *'tidak'*.`;

        const sentMsg = await m.reply(question);

        const session = {
            command: 'update',
            step: 'confirm_format',
            filePath: filePath,
            newCode: newCode,
            messageId: sentMsg.key.id,
            timeout: setTimeout(() => {
                if (activeSessions.has(m.sender)) {
                    activeSessions.delete(m.sender);
                    sock.sendMessage(m.from, { text: '[SISTEM] Sesi update telah berakhir karena waktu habis.' }, { quoted: sentMsg });
                }
            }, 60 * 1000)
        };
        activeSessions.set(m.sender, session);
    },

    async onReply(context) {
        const { sock, m, session, activeSessions } = context;
        const reply = m.text.toLowerCase().trim();
        const validReplies = ['ya', 'tidak'];

        if (!validReplies.includes(reply)) {
            return m.reply(`[SISTEM] Input tidak valid. Harap balas dengan 'ya' atau 'tidak'.`);
        }

        clearTimeout(session.timeout);
        let finalCode = session.newCode;

        if (reply === 'ya') {
            await m.reply('Konfirmasi diterima. Merapikan kode...');
            finalCode = formatCode(session.newCode);
        } else {
            await m.reply('Konfirmasi diterima. Menggunakan kode asli...');
        }

        try {
            await fs.writeFile(session.filePath, finalCode);
            await m.reply(`✅ *Transplantasi Berhasil*\n\nFile \`${session.filePath}\` telah berhasil diperbarui. Restart bot untuk menerapkan perubahan.`);
        } catch (error) {
            await m.reply(`[ANOMALI] Gagal menulis file: ${error.message}`);
        } finally {
            activeSessions.delete(m.sender);
        }
    }
};
