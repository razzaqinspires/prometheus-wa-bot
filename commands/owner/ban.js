// commands/owner/ban.js (V2.0 - Modular & Context-Aware)

import fs from 'fs/promises';

export default {
    name: 'ban',
    category: 'Owner',
    description: 'Memblokir pengguna dari menggunakan bot.',
    usage: 'ban <@tag|reply>',
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
            return m.reply('Anda harus menandai (@tag) atau membalas pesan pengguna yang ingin diblokir.');
        }

        const targetId = targetUser.split('@')[0];
        if (config.ownerNumbers.includes(targetId)) {
            return m.reply('[KEAMANAN] Entitas Owner tidak dapat diblokir.');
        }

        const db = await readDB();
        if (db[targetUser]) {
            return m.reply(`[SISTEM] Pengguna @${targetId} sudah berada dalam daftar blokir.`, { mentions: [targetUser] });
        }

        db[targetUser] = { bannedBy: m.sender, date: new Date().toISOString() };

        try {
            await fs.writeFile(BANNED_DB_PATH, JSON.stringify(db, null, 2));
            await m.reply(`✅ *Pengguna Diblokir*\n\nEntitas @${targetId} telah berhasil diblokir.`, { mentions: [targetUser] });
        } catch (error) {
            logger.error({ err: error }, "Gagal menyimpan database ban.");
            await m.reply("Terjadi kegagalan saat mencoba menyimpan data blokir.");
        }
    }
};
