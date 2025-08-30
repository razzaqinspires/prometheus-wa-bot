// commands/moderation/aichat.js

import fs from 'fs';

export default {
    name: 'aichat',
    description: 'Mengelola status AI chat di chat ini.',
    async execute({ sock, m, args, from, bannedAIChats }) { // 'm' di sini adalah objek yang sudah di-serialize
    const action = args[0]?.toLowerCase();
    let responseText;

    if (action === '--ban') {
        bannedAIChats.add(from);
        fs.writeFileSync('./data/bannedAIChats.json', JSON.stringify([...bannedAIChats]));
        responseText = '[AI] Fitur AI Chat telah dinonaktifkan di sini.';
    } else if (action === '--unban') {
        bannedAIChats.delete(from);
        fs.writeFileSync('./data/bannedAIChats.json', JSON.stringify([...bannedAIChats]));
        responseText = '[AI] Fitur AI Chat telah diaktifkan kembali di sini.';
    } else {
        responseText = "Gunakan: .aichat --ban atau .aichat --unban";
    }

    // PERBAIKI BARIS INI: Gunakan 'm.raw' untuk mengutip
    await sock.sendMessage(from, { text: responseText }, { quoted: m.raw });
},
category: 'Moderation'
};
