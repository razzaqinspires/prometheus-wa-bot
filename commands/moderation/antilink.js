// commands/moderation/antilink.js

import fs from 'fs';
const ANTILINK_DB = './data/antilink.json';

// Fungsi untuk memastikan bot adalah admin
async function isBotAdmin(sock, msg, groupMetadata) {
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botParticipant = groupMetadata.participants.find(p => p.id === botId);
    return botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
}

export default {
    name: 'antilink',
    usage: 'antilink <on|off|allow|disallow> [link]',
    category: 'Moderation',
    permission: {
        restriction: [['group', 'admin']],
        prompt: 'Perintah ini hanya dapat dieksekusi oleh administrator grup.'
    },
    async execute({ sock, m, args }) {
        const action = args[0]?.toLowerCase();
        const antilinkData = JSON.parse(fs.readFileSync(ANTILINK_DB));
        const groupMetadata = await sock.groupMetadata(m.from);

        if (!(await isBotAdmin(sock, m, groupMetadata))) {
            return m.reply('[SISTEM] Gagal mengaktifkan. Saya harus menjadi admin untuk menggunakan modul pertahanan ini.');
        }

        if (!antilinkData[m.from]) {
            antilinkData[m.from] = {
                enabled: false,
                allowedLinks: ["youtube.com", "instagram.com", "tiktok.com"],
                userWarnings: {},
                admins: []
            };
        }

        // Simpan daftar admin saat ini untuk pengecualian
        antilinkData[m.from].admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

        switch (action) {
            case 'on':
            antilinkData[m.from].enabled = true;
            await m.reply('[SISTEM] Modul pertahanan aktif .antilink telah diaktifkan.');
            break;
            case 'off':
            antilinkData[m.from].enabled = false;
            await m.reply('[SISTEM] Modul pertahanan aktif .antilink telah dinonaktifkan.');
            break;
            case 'allow':
            const linkToAdd = args[1];
            if (!linkToAdd) return m.reply('Format salah. Contoh: .antilink allow facebook.com');
            antilinkData[m.from].allowedLinks.push(linkToAdd);
            await m.reply(`[SISTEM] Tautan yang mengandung "${linkToAdd}" sekarang diizinkan.`);
            break;
            case 'disallow':
            const linkToRemove = args[1];
            if (!linkToRemove) return m.reply('Format salah. Contoh: .antilink disallow facebook.com');
            antilinkData[m.from].allowedLinks = antilinkData[m.from].allowedLinks.filter(link => link !== linkToRemove);
            await m.reply(`[SISTEM] Tautan yang mengandung "${linkToRemove}" sekarang diblokir.`);
            break;
            default:
            await m.reply('Opsi tidak valid. Gunakan: on, off, allow, disallow.');
            break;
        }

        fs.writeFileSync(ANTILINK_DB, JSON.stringify(antilinkData, null, 2));
    }
};
