// services/serializer.js (V3.0 - Perception & Serialization Engine)
// Filosofi: Mengubah data mentah menjadi persepsi yang diperkaya dan sadar-konteks.
// Setiap objek 'msg' yang dihasilkan adalah representasi lengkap dari peristiwa komunikatif.

import { makeWASocket, getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

// Cache untuk media yang sering diakses (in-memory, akan di-reset saat restart)
const mediaCache = new Map();
const { proto } = makeWASocket;

function loadDB(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (e) {
        console.error(`Gagal memuat database di ${filePath}`, e);
    }
    return {};
}

const registeredUsers = loadDB('./data/registeredUsers.json');
const bannedUsers = loadDB('./data.bannedUsers.json');

/**
* Mem-parsing, memperkaya, dan menstandardisasi objek pesan dari Baileys menjadi
* sebuah entitas perseptif yang komprehensif.
* @param {import('@whiskeysockets/baileys').WASocket} sock Instansi Socket
* @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} rawMsg Objek pesan mentah
* @param {object} state - Objek state dari StateManager untuk penyuntikan konteks
* @returns {Promise<object|null>} Objek pesan yang sudah di-serialize atau null jika tidak valid
*/
export async function serialize(sock, rawMsg, state, config, logger) {
    if (!rawMsg || !rawMsg.message) return null;

    const msg = {};

    // =====================================================
    // TAHAP 1: IDENTITAS & ASAL-USUL DASAR
    // =====================================================
    msg.raw = rawMsg;
    msg.key = rawMsg.key;
    msg.from = rawMsg.key.remoteJid;
    msg.id = rawMsg.key.id;
    msg.isGroup = msg.from.endsWith('@g.us');
    msg.fromMe = rawMsg.key.fromMe;
    msg.pushName = rawMsg.pushName || 'Tanpa Nama';

    const botJid = sock?.user?.id?.split(':')[0] + '@s.whatsapp.net' ?? '';

    if (msg.fromMe) {
        // Jika pesan dikirim oleh bot, pengirimnya adalah bot itu sendiri.
        msg.sender = botJid;
    } else if (msg.isGroup) {
        // Di grup, 'rawMsg.sender' adalah JID asli, 'rawMsg.key.participant' bisa jadi @lid.
        msg.sender = rawMsg.sender || rawMsg.key.participant;
    } else {
        // Di chat pribadi, pengirimnya adalah lawan bicara.
        msg.sender = msg.from;
    }

    if (!msg.sender || msg.sender.endsWith('@lid')) {
        logger.warn({ lid: msg.sender, key: msg.key }, '[SERIALIZER] Mengabaikan pesan dari JID @lid atau pengirim tidak valid.');
        return null;
    }

    // =====================================================
    // TAHAP 2: INJEKSI STATUS & KONTEKS (PERSEPSI INTERNAL)
    // =====================================================
    const senderId = msg.sender.split('@')[0];

    // [PERBAIKAN KRITIS] Menggunakan 'config' yang diinjeksi, bukan dari impor statis.
    msg.isOwner = (config.ownerNumbers || []).includes(senderId);

    msg.isBot = msg.sender === botJid;
    msg.isPremium = state.premiumUsers?.includes(msg.sender) || false;
    msg.isRegistered = !!state.registeredUsers?.[msg.sender];
    msg.isBanned = !!state.bannedUsers?.[msg.sender];

    // =====================================================
    // TAHAP 3 & 4: ANALISIS KONTEN & LINGUISTIK
    // =====================================================
    msg.message = rawMsg.message;
    msg.type = getContentType(msg.message) || null;
    const messageContent = msg.message[msg.type];

    msg.body = msg.message.conversation ||
    messageContent?.text ||
    messageContent?.caption ||
    (msg.type === 'listResponseMessage' && messageContent?.singleSelectReply?.selectedRowId) ||
    (msg.type === 'buttonsResponseMessage' && messageContent?.selectedButtonId) ||
    '';

    msg.text = msg.body;

    const prefix = /^[\\/!#.]/gi;
    msg.isCmd = prefix.test(msg.text);
    msg.prefix = msg.isCmd ? msg.text.match(prefix)[0] : null;

    const [command, ...args] = msg.text.replace(prefix, '').trim().split(/ +/).filter(Boolean);

    // [PERBAIKAN KRITIS] Pastikan 'command' ada sebelum memanggil .toLowerCase()
    msg.command = msg.isCmd && command ? command.toLowerCase() : null;

    msg.args = args || [];
    msg.mentionedJid = messageContent?.contextInfo?.mentionedJid || [];
    msg.urls = msg.text.match(/https?:\/\/[^\s/$.?#].[^\s]*/gi) || [];

    // =====================================================
    // TAHAP 5: ANALISIS MEDIA & KUTIPAN
    // =====================================================
    msg.isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(msg.type);
    msg.isQuoted = !!messageContent?.contextInfo?.quotedMessage;
    msg.quoted = null;

    if (msg.isQuoted) {
        const quotedInfo = messageContent.contextInfo;
        const pseudoMessage = {
            key: { remoteJid: msg.from, fromMe: quotedInfo.participant === botJid, id: quotedInfo.stanzaId, participant: quotedInfo.participant },
            message: quotedInfo.quotedMessage
        };
        // [PERBAIKAN KRITIS] Teruskan 'config' dan 'logger' dalam panggilan rekursif.
        msg.quoted = await serialize(sock, pseudoMessage, state, config, logger);
    }

    // =====================================================
    // TAHAP 6: FUNGSI UTILITAS YANG DIPERKAYA
    // =====================================================
    msg.reply = (text, options = {}) => sock.sendMessage(msg.from, { text }, { quoted: rawMsg, ...options });
    msg.react = (emoji) => sock.sendMessage(msg.from, { react: { text: emoji, key: msg.key } });
    msg.download = async () => {
        const cacheKey = msg.key.id;
        if (mediaCache.has(cacheKey)) return mediaCache.get(cacheKey);
        try {
            const stream = await downloadMediaMessage(rawMsg, 'buffer', {});
            mediaCache.set(cacheKey, stream);
            setTimeout(() => mediaCache.delete(cacheKey), 5 * 60 * 1000);
            return stream;
        } catch (e) {
            logger.error({ err: e }, "Gagal mengunduh media.");
            return null;
        }
    };

    return msg;
}
