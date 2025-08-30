// commands/utility/rvo.js (REKAYASA ULANG - Dengan Perizinan)

import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs/promises';

export default {
    name: 'rvo',
    aliases: ['lihatlagi'],
    category: 'Utility',
    description: 'Mengarsipkan media sekali lihat secara manual dengan membalas pesannya.',

    // [PENINGKATAN] Arsitektur perizinan terpusat ditambahkan
    permission: {
        restriction: ['premium', 'owner'], // Dibaca sebagai: premium ATAU owner
        prompt: 'Perintah ini hanya dapat diakses oleh pengguna Premium atau Owner.'
    },

    async execute(context) {
        // Pemeriksaan 'isOwner' dan 'isPremium' tidak perlu lagi di sini
        const { sock, m, logger } = context;

        if (!m.isQuoted) {
            return m.reply('Perintah ini harus digunakan dengan membalas pesan sekali lihat yang ingin diarsipkan.');
        }

        const quotedRaw = m.quoted?.raw;
        const quotedMessage = quotedRaw?.message;

        if (!quotedMessage) {
            return m.reply('[VALIDASI] Gagal memuat konten pesan yang Anda balas.');
        }

        // ... Sisa dari logika deteksi dual-mode dan pengiriman media tetap sama persis ...
        let actualMessageContent = null;
        let messageType = null;
        const viewOnceContainer = quotedMessage.viewOnceMessageV2 || quotedMessage.viewOnceMessage;
        if (viewOnceContainer && viewOnceContainer.message) {
            actualMessageContent = viewOnceContainer.message;
        } else {
            const mediaKeys = ['imageMessage', 'videoMessage', 'audioMessage'];
            for (const key of mediaKeys) {
                if (quotedMessage[key]?.viewOnce === true) {
                    actualMessageContent = { [key]: quotedMessage[key] };
                    break;
                }
            }
        }
        if (!actualMessageContent) {
            return m.reply('[VALIDASI] Pesan yang Anda balas bukan media sekali lihat yang valid.');
        }
        messageType = Object.keys(actualMessageContent)[0];

        try {
            await m.react('⏱️');
            const buffer = await downloadMediaMessage(quotedRaw, 'buffer', {});
            const caption = `👁️ *Arsip Manual Media Sekali Lihat*\n\n*Dari:* @${m.quoted.sender.split('@')[0]}\n*Diarsipkan oleh:* @${m.sender.split('@')[0]}`;
            const mentions = [m.quoted.sender, m.sender];
            if (messageType === 'imageMessage') {
                await sock.sendMessage(m.from, { image: buffer, caption, mentions });
            } else if (messageType === 'videoMessage') {
                await sock.sendMessage(m.from, { video: buffer, caption, mentions });
            } else if (messageType === 'audioMessage') {
                await sock.sendMessage(m.from, { audio: buffer, mimetype: 'audio/mp4', ptt: actualMessageContent.audioMessage?.ptt || false });
                await sock.sendMessage(m.from, { text: caption, mentions });
            }
            await m.react('✅');
        } catch (error) {
            await m.react('❌');
            logger.error({ err: error }, `[RVO MANUAL] Gagal mengarsipkan media.`);
            await m.reply(`[SISTEM] Gagal mengarsipkan media. Kemungkinan media sudah kedaluwarsa atau terjadi error jaringan.`);
        }
    }
};
