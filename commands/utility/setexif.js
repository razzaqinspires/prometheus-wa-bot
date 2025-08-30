// commands/utility/setexif.js (Tidak Ada Perubahan)

import fs from 'fs/promises';
const EXIF_DB = './data/exif.json';

export default {
    name: 'setexif',
    usage: 'setexif <packname|authorname>',
    category: 'Utility',
    description: 'Mengatur nama pack dan author default untuk stiker Anda.',

    async execute({ m, text }) {
        if (!text || !text.includes('|')) {
            return m.reply('Format salah. Gunakan: .setexif Nama Pack|Nama Author');
        }

        const [packname, author] = text.split('|').map(s => s.trim());
        if (!packname || !author) {
            return m.reply('Nama pack dan author tidak boleh kosong.');
        }

        const exifData = JSON.parse(await fs.readFile(EXIF_DB, 'utf-8').catch(() => '{}'));
        exifData[m.sender] = { packname, author };
        await fs.writeFile(EXIF_DB, JSON.stringify(exifData, null, 2));

        await m.reply(`[SISTEM] EXIF default Anda telah diatur:\n- Pack: ${packname}\n- Author: ${author}`);
    }
};
