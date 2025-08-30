// core/EventHandler.js (V13.5 - Bulletproof Error Handling)
// Arsitektur: Prometheus V13.5 - Sentient Reflex Arc & Message Processing Pipeline
// Perbaikan: Menerapkan penanganan promise yang aman di dalam blok catch untuk mencegah Unhandled Rejection.

import { serialize } from '../services/serializer.js';
import { findBestMatch } from 'string-similarity';
import { consumeEnergy, aiState } from '../services/AIStateManager.js';
import { checkPermissions } from './PermissionHandler.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import util from 'util';
import { assimilateMessage } from '../services/PassivePerception.js';

/**
* Utilitas untuk memastikan objek error aman untuk di-log.
* @param {any} error - Error yang ditangkap.
* @returns {Error} Objek Error yang aman.
*/
function normalizeError(error) {
    if (error instanceof Error) {
        return error;
    }
    if (typeof error === 'object' && error !== null) {
        const newError = new Error(error.message || 'Objek error tidak standar');
        newError.stack = error.stack || (new Error()).stack;
        Object.assign(newError, error);
        return newError;
    }
    return new Error(`Error non-objek dilempar: ${util.format(error)}`);
}

/**
* Kelas ini bertindak sebagai sistem saraf pusat, mengelola alur
* pemrosesan untuk setiap pesan yang masuk.
*/
export default class EventHandler {
    /**
    * @param {import('./Bot.js').default} bot Instance Bot utama.
    * @param {import('pino').Logger} logger Instance child logger yang sudah diinjeksi.
    */
    constructor(bot) {
        this.bot = bot;
        this.logger = bot.logger;
        this.config = bot.config;
        this.state = bot.stateManager.state;
    }

    /**
    * Metode utama yang memulai pipa pemrosesan pesan.
    * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} rawMsg Objek pesan mentah.
    */
    async processMessage(rawMsg) {
        try {
            const msg = await serialize(this.bot.sock, rawMsg, this.state, this.config, this.logger);

            if (!msg) return;

            if (await this._runPreChecks(msg)) return;
            await this._handlePassivePerception(msg);
            if (await this._handleViewOnce(msg)) return;
            if (await this._handleOwnerExecution(msg)) return;
            if (await this._handleSessionReply(msg)) return;
            if (await this._handleGroupModeration(msg)) return;
            if (await this._handleCommand(msg)) return;
            if (await this._handleAIInteraction(msg)) return;

        } catch (error) {
            const safeError = normalizeError(error);
            this.logger.error({ err: safeError }, 'Kegagalan tak terduga di tingkat atas Message Handler.');
            this.bot.cognitiveCore?.update('error', 1);
        }
    }

    async _runPreChecks(msg) {
        if (msg.isBanned) return true;
        if (this.state.mutedChats?.has(msg.from)) return true;
        return false;
    }

    async _handlePassivePerception(msg) {
        try {
            await assimilateMessage(msg);
        } catch (err) { this.logger.error({ err: normalizeError(err) }, '[PERSEPSI] Gagal mengasimilasi pesan.'); }
        return false;
    }

    async _handleViewOnce(msg) {
        const viewOnceMsg = msg.raw.message?.viewOnceMessageV2 || msg.raw.message?.viewOnceMessage;
        if (viewOnceMsg?.message && this.state.rvom?.[msg.from]) {
            try {
                const actualMessage = viewOnceMsg.message;
                const messageType = Object.keys(actualMessage)[0];
                const pseudoMessage = { key: msg.key, message: { [messageType]: actualMessage[messageType] } };
                const buffer = await downloadMediaMessage(pseudoMessage, 'buffer', {});
                const caption = `👁️ *Pesan Sekali Lihat Terdeteksi*\n\n*Dari:* @${msg.sender.split('@')[0]}`;
                const options = { caption, mentions: [msg.sender] };
                if (messageType === 'imageMessage') await this.bot.sock.sendMessage(msg.from, { image: buffer, ...options });
                else if (messageType === 'videoMessage') await this.bot.sock.sendMessage(msg.from, { video: buffer, ...options });
            } catch (error) { this.logger.error({ err: error }, `[RVO] Gagal mengarsipkan media.`); }
            return true;
        }
        return false;
    }

    async _handleOwnerExecution(msg) {
        if (msg.isOwner && (msg.text.startsWith('$') || msg.text.startsWith('=>'))) {
            const command = msg.text.slice(msg.text.startsWith('$') ? 1 : 2).trim();
            if (!command) return true;
            try {
                if (msg.text.startsWith('$')) {
                    exec(command, (err, stdout, stderr) => {
                        if (err) return msg.reply(`[EXEC-ERROR]\n${util.format(err)}`);
                        if (stderr) return msg.reply(`[EXEC-STDERR]\n${util.format(stderr)}`);
                        return msg.reply(`[EXEC-STDOUT]\n${util.format(stdout)}`);
                    });
                } else {
                    const result = await eval(`(async () => {
                        const bot = this.bot; const sock = this.bot.sock; const m = msg;
                        const state = this.state; const config = this.config; return ${command};
                    })()`);
                    await msg.reply(`[EVAL-SUCCESS]\n${util.format(result)}`);
                }
            } catch (e) { await msg.reply(`[EVAL-ERROR]\n${util.format(e)}`); }
            return true;
        }
        return false;
    }

    async _handleSessionReply(msg) {
        if (msg.isQuoted && this.state.activeSessions.has(msg.sender)) {
            const session = this.state.activeSessions.get(msg.sender);
            if (msg.quoted.id === session.messageId) {
                clearTimeout(session.timeout);
                const command = this.bot.commandManager.getCommand(session.command);
                if (command?.onReply) {
                    try {
                        const context = {
                            bot: this.bot,
                            sock: this.bot.sock,
                            m: msg,
                            session,
                            // Dependensi lengkap untuk modularitas
                            config: this.bot.config,
                            stateManager: this.bot.stateManager,
                            commandManager: this.bot.commandManager,
                            aiServiceManager: this.bot.aiServiceManager,
                            aiState: aiState,
                            logger: this.logger
                        };
                        await command.onReply(context);
                    } catch (error) { this.logger.error({ err: error }, `Error pada onReply.`); }
                    return true;
                }
            }
        }
        return false;
    }

    async _handleGroupModeration(msg) {
        if (!msg.isGroup) return false;
        try {
            const antilinkConfig = this.state.antilink?.[msg.from];
            if (!antilinkConfig?.enabled) return false;
            const linkRegex = /(https?:\/\/[^\s]+)/g;
            if (linkRegex.test(msg.text)) {
                const groupMetadata = await this.bot.sock.groupMetadata(msg.from);
                const participant = groupMetadata.participants.find(p => p.id === msg.sender);
                if (participant?.admin || msg.isOwner) return false;
                await this.bot.sock.sendMessage(msg.from, { delete: msg.key });
                await this.bot.sock.sendMessage(msg.from, { text: `🚨 @${msg.sender.split('@')[0]} dilarang mengirim tautan!`, mentions: [msg.sender] });
                return true;
            }
        } catch (error) { this.logger.error({ err: error }, "Gagal menjalankan moderasi antilink."); }
        return false;
    }

    async _handleCommand(msg) {
        if (!msg.isCmd) return false;
        const command = this.bot.commandManager.getCommand(msg.command);

        if (!command) {
            const allCommands = [...this.bot.commandManager.commands.keys(), ...this.bot.commandManager.aliases.keys()];
            const { bestMatch } = findBestMatch(msg.command, allCommands);
            if (bestMatch.rating > 0.6) msg.reply(`Perintah tidak ditemukan. Maksud Anda: \`${msg.prefix}${bestMatch.target}\`?`);
            return true;
        }

        const activeSession = this.bot.stateManager.state.activeSessions.get(msg.sender);
        if (activeSession && !command.allowDuringSession) {
            let countdownText = '';
            // Cek apakah sesi memiliki data kedaluwarsa
            if (activeSession.expiresAt) {
                const remainingMs = activeSession.expiresAt - Date.now();
                if (remainingMs > 0) {
                    const remainingSeconds = Math.ceil(remainingMs / 1000);
                    countdownText = `\n\n_Sesi ini akan berakhir dalam *${remainingSeconds} detik*._`;
                }
            }
            await msg.reply(`[SISTEM] Anda sedang dalam sesi aktif (\`${activeSession.command}\`). Harap selesaikan atau batalkan sesi tersebut terlebih dahulu.${countdownText}`);
            return true;
        }

        try {
            const permissionResult = await checkPermissions(this.bot, msg, command);
            if (!permissionResult.authorized) {
                if (permissionResult.message) await msg.reply(permissionResult.message);
                return true;
            }

            const now = Date.now();
            const cooldownAmount = (command.cooldown || 3) * 1000;
            const cooldownKey = `${command.name}-${msg.sender}`;
            if (this.state.cooldowns.has(cooldownKey) && (now < this.state.cooldowns.get(cooldownKey))) return true;
            this.state.cooldowns.set(cooldownKey, now + cooldownAmount);

            const context = {
                bot: this.bot,
                sock: this.bot.sock,
                m: msg,
                args: msg.args,
                text: msg.body, // Gunakan msg.body untuk konsistensi
                isOwner: msg.isOwner,
                // Injeksi semua manajer dan state yang relevan
                config: this.bot.config,
                stateManager: this.bot.stateManager,
                commandManager: this.bot.commandManager,
                aiServiceManager: this.bot.aiServiceManager,
                aiState: aiState,
                logger: this.logger
            };
            await command.execute(context);
            consumeEnergy(0.2);
            this.state.systemStats.commandHits[command.name] = (this.state.systemStats.commandHits[command.name] || 0) + 1;
        } catch (error) {
            // [PERBAIKAN UTAMA] Normalisasi error SEBELUM melakukan logging.
            const safeError = normalizeError(error);

            this.bot.cognitiveCore.update('error', 1);
            // Sekarang logger dijamin menerima objek Error yang valid.
            this.logger.error({ err: safeError }, `Eksekusi perintah '${command.name}' gagal.`);

            try {
                await msg.reply('Terjadi anomali internal saat menjalankan perintah ini.');
            } catch (replyError) {
                this.logger.error({ err: normalizeError(replyError) }, 'Gagal mengirim pesan balasan error.');
            }
        }
        return true;
    }

    async _handleAIInteraction(msg) {
        const botNumber = this.bot.sock.user.id.split(':')[0];
        const isReplyingToBot = msg.isQuoted && msg.quoted.sender.startsWith(botNumber);
        const isMentioningBot = msg.text.includes(`@${botNumber}`);
        const triggerAIChat = !msg.isGroup || isReplyingToBot || isMentioningBot;

        const isBotSelfChat = (this.state.settings.botMode === 'self' && !msg.isOwner);
        const isChatBanned = this.state.bannedAIChats?.has(msg.from);

        if (triggerAIChat && !isBotSelfChat && !isChatBanned) {
            try {
                await this.bot.aiServiceManager.handleAIChat({
                    sock: this.bot.sock,
                    m: msg,
                    from: msg.from,
                    systemStats: this.state.systemStats
                });
            } catch (error) {
                this.bot.cognitiveCore.update('error', 1);
                this.logger.error({ err: error }, 'Gagal saat menangani interaksi AI.');
            }
            return true;
        }
        return false;
    }
}
