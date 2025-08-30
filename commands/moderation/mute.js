// commands/moderation/mute.js
import fs from 'fs';

export default {
    name: 'mute',
    description: 'Mendiamkan bot di grup ini (on/off).',
    usage: 'mute <on|off>',
    category: 'Moderation',
    permission: {
        restriction: [['group', 'admin']], // Harus admin DAN di dalam grup
        prompt: 'Perintah ini hanya dapat dieksekusi oleh administrator grup.',
        ai: true // Biarkan AI yang merespons
    },
    async execute({ sock, m, args, isGroup, from, mutedChats }) {
        if (!isGroup) return sock.sendMessage(from, { text: 'Perintah ini hanya untuk grup.' }, { quoted: m });

        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            mutedChats.add(from);
            fs.writeFileSync('./data/mutedChats.json', JSON.stringify([...mutedChats]));
            await sock.sendMessage(from, { text: '[SISTEM] Bot telah dimute di grup ini.' }, { quoted: m });
        } else if (action === 'off') {
            mutedChats.delete(from);
            fs.writeFileSync('./data/mutedChats.json', JSON.stringify([...mutedChats]));
            await sock.sendMessage(from, { text: '[SISTEM] Bot telah di-unmute di grup ini.' }, { quoted: m });
        } else {
            await sock.sendMessage(from, { text: 'Gunakan: .mute on atau .mute off' }, { quoted: m });
        }
    },
};
