// commands/owner/unban.js (V2.0 - Modular & Context-Aware)

import fs from 'fs/promises';

export default {
    name: 'unban',
    category: 'Owner',
    description: 'Membuka blokir pengguna.',
    usage: 'unban <@tag|reply>',
    permission: { restriction: ['owner'] },

    async execute({ m, config, logger }) {
        const BANNED_DB_PATH = config.paths.bannedUsers;

        const readDB = async () => {
            try {
                return JSON.parse(await fs.readFile(BANNED_DB_PATH, 'utf-8'));
            } catch (e) { return {}; }
        };

        let targetUser = m.isQuoted ? m.quoted.sender : m.mentionedJid?.[0];
        if (!targetUser) {
            return m.reply('Anda harus menandai (@tag) atau membalas pesan pengguna yang blokirnya ingin dibuka.');
        }

        const targetId = targetUser.split('@')[0];
        const db = await readDB();

        if (!db[targetUser]) {
            return m.reply(`[SISTEM] Pengguna @${targetId} tidak ditemukan dalam daftar blokir.`, { mentions: [targetUser] });
        }

        delete db[targetUser];

        try {
            await fs.writeFile(BANNED_DB_PATH, JSON.stringify(db, null, 2));
            await m.reply(`✅ *Blokir Dibuka*\n\nAkses untuk entitas @${targetId} telah dipulihkan.`, { mentions: [targetUser] });
        } catch (error) {
            logger.error({ err: error }, "Gagal menyimpan database ban.");
            await m.reply("Terjadi kegagalan saat mencoba menyimpan data blokir.");
        }
    }
};
