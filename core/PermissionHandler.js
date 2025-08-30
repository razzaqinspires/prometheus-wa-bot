// core/PermissionHandler.js (BARU)

import config from '../config.js';

/**
* Memeriksa apakah pengguna memiliki izin untuk mengeksekusi perintah.
* @param {Bot} bot - Instansi kelas Bot utama.
* @param {object} msg - Objek pesan yang telah di-serialize.
* @param {object} command - Objek perintah.
* @returns {Promise<{authorized: boolean, message: string|null}>}
*/
export async function checkPermissions(bot, msg, command) {
    if (!command.permission) {
        return { authorized: true, message: null };
    }

    const { restriction, prompt, ai } = command.permission;
    const { ownerNumbers } = config;
    const { premiumUsers } = bot.stateManager.state;
    const senderId = msg.sender.split('@')[0];
    let isAuthorized = false;
    let groupMetadata = null;

    for (const rule of restriction) {
        if (isAuthorized) break;

        if (typeof rule === 'string') {
            if (rule === 'owner' && ownerNumbers.includes(senderId)) isAuthorized = true;
            if (rule === 'premium' && premiumUsers.includes(senderId)) isAuthorized = true;
        }
        else if (Array.isArray(rule)) {
            let conditionsMet = true;
            for (const condition of rule) {
                if (condition === 'group' && !msg.isGroup) conditionsMet = false;
                if (condition === 'admin') {
                    if (!msg.isGroup) {
                        conditionsMet = false;
                        break;
                    }
                    if (!groupMetadata) groupMetadata = await bot.sock.groupMetadata(msg.from);
                    const participant = groupMetadata.participants.find(p => p.id === msg.sender);
                    if (!participant || !participant.admin) conditionsMet = false;
                }
                if (!conditionsMet) break;
            }
            if (conditionsMet) isAuthorized = true;
        }
    }

    if (isAuthorized) {
        return { authorized: true, message: null };
    } else {
        if (ai) {
            // eventBus.emit(...) jika Anda menggunakan event bus
            return { authorized: false, message: null };
        } else {
            return { authorized: false, message: prompt || 'Akses ditolak.' };
        }
    }
}
