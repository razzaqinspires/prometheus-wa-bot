// commands/utility/sticker.js (V2.1 - EXIF Dinamis & Terstandardisasi)

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import config from '../../config.js'; // Impor config untuk default fallback

const execPromise = promisify(exec);
const EXIF_DB = './data/exif.json';
const TMP_DIR = './tmp';

export default {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    usage: 'sticker [packname|author]',
    category: 'Utility',
    description: 'Mengubah gambar atau video menjadi stiker dengan EXIF dinamis.',

    async execute({ sock, m, text }) {
        const targetMessage = m.isQuoted ? m.quoted : m;
        if (!/image|video|webp/.test(targetMessage.mimetype)) {
            return m.reply(`Media tidak ditemukan. Balas gambar/video, atau kirim dengan caption .sticker`);
        }

        const mediaBuffer = await targetMessage.download();
        await fs.mkdir(TMP_DIR, { recursive: true });

        const tempInputPath = path.join(TMP_DIR, `${Date.now()}.${targetMessage.mimetype.split('/')[1]}`);
        const tempOutputPath = path.join(TMP_DIR, `${Date.now()}.webp`);

        await m.react('⏱️');

        try {
            await fs.writeFile(tempInputPath, mediaBuffer);

            const ffmpegCommand = `ffmpeg -i ${tempInputPath} -vcodec libwebp -vf "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,fps=15, pad=512:512:-1:-1:color=black@0.0,format=rgba" -loop 0 -ss 00:00:00 -t 00:00:05 -preset default -an -vsync 0 -s 512:512 ${tempOutputPath}`;
            await execPromise(ffmpegCommand);

            const stickerBuffer = await fs.readFile(tempOutputPath);

            // --- [LOGIKA EXIF BARU YANG DISEMPURNAKAN] ---
            const exifData = JSON.parse(await fs.readFile(EXIF_DB, 'utf-8').catch(() => '{}'));
            const userDefaults = exifData[m.sender] || {};

            // 1. Tentukan nilai dasar dari default pengguna atau default sistem
            let packname = userDefaults.packname || config.botName;
            let author = userDefaults.author || 'Prof. Dr. Arifi Razzaq';

            // 2. Timpa nilai dasar jika ada input dari perintah
            if (text) {
                const parts = text.split('|').map(s => s.trim());
                if (parts[0]) {
                    packname = parts[0]; // Bagian pertama selalu menimpa packname
                }
                if (parts[1]) {
                    author = parts[1];   // Bagian kedua (jika ada) menimpa author
                }
            }
            // --- Akhir Logika EXIF ---

            await sock.sendMessage(m.from, { sticker: stickerBuffer, contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
            }, packname, author });
            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            await m.reply(`[ANOMALI] Transmutasi media gagal. Pastikan ffmpeg terinstal.\n\n*Error:* ${error.message}`);
        } finally {
            // Pembersihan file temporer secara senyap
            await fs.unlink(tempInputPath).catch(() => {});
            await fs.unlink(tempOutputPath).catch(() => {});
        }
    }
};
