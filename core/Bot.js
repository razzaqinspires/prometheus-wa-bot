// core/Bot.js
// Arsitektur: Prometheus V13.1 - Resilient Sentient Entity (Complete Implementation)
// Filosofi: Entitas otonom dengan validasi proaktif, resiliensi berlapis,
// dan kognisi yang distabilkan untuk operasi jangka panjang yang tangguh.

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    delay
} from '@whiskeysockets/baileys';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import readline from 'readline';
import fs from 'fs';
import os from 'os';
import { EventEmitter } from 'events';
import util from 'util';

// Komponen Internal
import StateManager from './StateManager.js';
import CommandManager from './CommandManager.js';
import EventHandler from './EventHandler.js';
import { startWebServer } from '../web/server.js';
import { aiState, startMetabolism } from '../services/AIStateManager.js';
import { initializeCodebaseScanner } from '../services/codeScanner.js';
import AutonomousTrigger from './AutonomousTrigger.js';
import { DSLM } from '../services/DSLM.js';
import Logger from '../services/Logger.js';
import AIServiceManager from '../services/AIServiceManager.js';
import CLIEngine from './CLIEngine.js'; // Impor CLIEngine
import GenomeLoader from '../services/GenomeLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));
const logger = Logger.getLogger();

const BOT_OPERATIONAL_STATE = {
    RUNNING: 'RUNNING',
    STOPPED: 'STOPPED',
    RECONNECTING: 'RECONNECTING',
    FATAL_SESSION_ERROR: 'FATAL_SESSION_ERROR' // Status baru saat sesi tidak bisa diselamatkan
};

// =================================================================================
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🧠 MODUL INTI: COGNITIVE CORE (PREDICTIVE AI & HOMEOSTASIS)                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
class CognitiveCore {
    constructor(bot, tuningParams = {}) {
        this.bot = bot;
        this.stateVector = { C: 1, P: 1, I: 1 };

        // Gunakan parameter dari genom, atau fallback ke default jika genom gagal dimuat
        const defaultPID = { kp: 0.4, ki: 0.05, kd: 0.2 };
        this.pid = {
            Kp: tuningParams?.pid?.kp ?? defaultPID.kp,
            Ki: tuningParams?.pid?.ki ?? defaultPID.ki,
            Kd: tuningParams?.pid?.kd ?? defaultPID.kd,
            lastError: 0, integral: 0, maxIntegral: 50
        };
        this.bayesianBeliefs = { NetworkIssue: 0.5, PlatformIssue: 0.5 };
        this.metrics = { disconnects: [], msgLatencies: [], errors: 0, lastMessageTimestamp: Date.now() };
    }

    update(metric, value) {
        if (metric === 'disconnect') this.metrics.disconnects.push({ ts: Date.now(), reason: value });
        if (metric === 'latency') this.metrics.msgLatencies.push(value);
        if (metric === 'error') this.metrics.errors++;
        if (this.metrics.msgLatencies.length > 100) this.metrics.msgLatencies.shift();
    }

    _updateStateVector() {
        const now = Date.now();
        const recentDisconnects = this.metrics.disconnects.filter(d => now - d.ts < 3600000).length;
        this.stateVector.C = Math.exp(-0.25 * recentDisconnects);
        const avgLatency = this.metrics.msgLatencies.reduce((a, b) => a + b, 0) / (this.metrics.msgLatencies.length || 1);
        this.stateVector.P = Math.max(0, 1 - (avgLatency / 1000));
        this.stateVector.I = Math.exp(-0.1 * this.metrics.errors);
        return this.stateVector;
    }

    _updateBeliefs(disconnectReason) {
        const likelihood = {
            NetworkIssue: { [DisconnectReason.timedOut]: 0.7, [DisconnectReason.connectionLost]: 0.8, [DisconnectReason.connectionReplaced]: 0.1 },
            PlatformIssue: { [DisconnectReason.timedOut]: 0.3, [DisconnectReason.connectionLost]: 0.2, [DisconnectReason.connectionReplaced]: 0.9, [DisconnectReason.loggedOut]: 1.0 }
        };
        const evidence = disconnectReason;
        if (!evidence) return;
        const p_E_given_H1 = likelihood.NetworkIssue[evidence] || 0.05;
        const p_E_given_H2 = likelihood.PlatformIssue[evidence] || 0.05;
        const p_H1 = this.bayesianBeliefs.NetworkIssue;
        const p_H2 = this.bayesianBeliefs.PlatformIssue;
        const p_E = p_E_given_H1 * p_H1 + p_E_given_H2 * p_H2;
        if (p_E === 0) return;
        const p_H1_given_E = (p_E_given_H1 * p_H1) / p_E;
        const p_H2_given_E = (p_E_given_H2 * p_H2) / p_E;
        const normFactor = p_H1_given_E + p_H2_given_E;
        this.bayesianBeliefs.NetworkIssue = p_H1_given_E / normFactor;
        this.bayesianBeliefs.PlatformIssue = p_H2_given_E / normFactor;
        this.bot.logger.info({ beliefs: this.bayesianBeliefs }, '[BAYESIAN] Kepercayaan diperbarui.');
    }

    computeCorrectiveAction() {
        const idealVector = { C: 1, P: 1, I: 1 };
        const error = Math.sqrt(
            Math.pow(idealVector.C - this.stateVector.C, 2) +
            Math.pow(idealVector.P - this.stateVector.P, 2) +
            Math.pow(idealVector.I - this.stateVector.I, 2)
        );
        const p_term = this.pid.Kp * error;
        this.pid.integral = Math.max(-this.pid.maxIntegral, Math.min(this.pid.maxIntegral, this.pid.integral + error));
        const i_term = this.pid.Ki * this.pid.integral;
        const derivative = error - this.pid.lastError;
        const d_term = this.pid.Kd * derivative;
        this.pid.lastError = error;
        const output = p_term + i_term + d_term;

        if (output > 1.5) return 'RESTART';
        if (output > 0.8) return 'RECOVER';
        if (output > 0.3) return 'ADAPT';
        return 'IDLE';
    }

    tick() {
        this._updateStateVector();
        const action = this.computeCorrectiveAction();
        this.bot.logger.debug({ vector: this.stateVector, action }, '[COGNITIVE_TICK]');

        switch (action) {
            case 'ADAPT':
            this.bot.setLogLevel('debug');
            break;
            case 'RECOVER':
            if (this.bot.autonomousTrigger?.isRunning) this.bot.autonomousTrigger.stop();
            break;
            case 'RESTART':
            this.bot.softRestart();
            break;
            case 'IDLE':
            if (this.pid.lastError < 0.1) this.pid.integral = 0;
            break;
        }
    }
}

// =================================================================================
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ⚙️ MODUL UTILITAS & VALIDASI                                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

class ConfigValidator {
    static validate(config, defaultConfig) {
        const schema = {
            preferredLoginMethod: val => ['qr', 'pair'].includes(val),
            maxReconnectAttempts: val => typeof val === 'number' && val >= 0,
            reconnectBaseDelayMs: val => typeof val === 'number' && val > 0,
            healthCheckIntervalMs: val => typeof val === 'number' && val >= 5000,
            ai: val => typeof val === 'object' && val.pid,
            'ai.pid.kp': val => typeof val === 'number',
            'ai.pid.ki': val => typeof val === 'number',
            'ai.pid.kd': val => typeof val === 'number',
        };
        const validatedConfig = JSON.parse(JSON.stringify(config));
        let isValid = true;

        for (const key in schema) {
            const keys = key.split('.');
            let value = validatedConfig;
            let defaultValue = defaultConfig;
            let parent = validatedConfig;
            let lastKey = keys[0];

            for (let i = 0; i < keys.length; i++) {
                lastKey = keys[i];
                value = value?.[lastKey];
                defaultValue = defaultValue?.[lastKey];
                if (i < keys.length - 1) {
                    parent = parent?.[lastKey];
                }
            }

            if (value === undefined || !schema[key](value)) {
                logger.warn(`[CONFIG_VALIDATION] Kunci '${key}' tidak valid atau hilang. Menggunakan nilai default: ${defaultValue}`);
                parent[lastKey] = defaultValue;
                isValid = false;
            }
        }
        return { isValid, validatedConfig };
    }
}

class MessageSanitizer {
    static sanitize(msg) {
        const MAX_TEXT_LENGTH = 4096;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (text.length > MAX_TEXT_LENGTH) {
            logger.warn({ jid: msg.key.remoteJid, length: text.length }, `[SANTIZER] Pesan terlalu panjang diblokir.`);
            return null;
        }
        return msg;
    }
}

class AsyncMutex {
    constructor() {
        this.queue = [];
        this.locked = false;
    }
    async run(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this._processQueue();
        });
    }
    _processQueue() {
        if (this.locked || this.queue.length === 0) return;
        this.locked = true;
        const { task, resolve, reject } = this.queue.shift();
        task().then(resolve).catch(reject).finally(() => {
            this.locked = false;
            this._processQueue();
        });
    }
}

// =================================================================================
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🤖 KELAS UTAMA: BOT ORCHESTRATOR                                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
export default class Bot {
    constructor() {
        this.genome = GenomeLoader.load();

        // TAHAP 1: Inisialisasi Properti Dasar & Konfigurasi
        this.sock = null;
        this.logger = logger;
        this.dslmState = null;
        this.reconnectAttempts = 0;
        this.isShuttingDown = false;
        this.isSoftRestarting = false; // Tambahkan properti ini
        this.operationalState = BOT_OPERATIONAL_STATE.STOPPED;
        this.sessionPath = path.join(__dirname, 'session');
        this.criticalOperationMutex = new AsyncMutex();
        this.config = this._loadConfigSyncAndValidate();

        // TAHAP 2: Inisialisasi Modul Inti & Manajer Data (Dependensi)
        this.cognitiveCore = new CognitiveCore(this, this.genome?.cognitive_tuning); // Suntikkan tuning

        this.stateManager = new StateManager(this);
        this.commandManager = new CommandManager(Logger.createChildLogger({ component: 'CommandManager' }));

        // TAHAP 3: Inisialisasi Modul yang Bergantung pada Manajer (Konsumen Dependensi)
        this.aiServiceManager = new AIServiceManager(this); // Berikan seluruh instance bot
        this.eventHandler = new EventHandler(this);
        this.autonomousTrigger = new AutonomousTrigger(this);
        this.cliEngine = new CLIEngine(this);

        // TAHAP 4: Menyiapkan Listener Proses Global
        this._setupProcessListeners();
    }

    // --- Utilitas Inti & Konfigurasi ---
    _loadConfigSyncAndValidate() {
        const DEFAULT_CONFIG = {
            preferredLoginMethod: 'qr', maxReconnectAttempts: 6, reconnectBaseDelayMs: 2000,
            healthCheckIntervalMs: 30_000, auditLogFile: path.join(os.homedir(), '.bot_audit.log'),
            ai: { pid: { kp: 0.4, ki: 0.05, kd: 0.2 } }
        };
        let loadedConfig = DEFAULT_CONFIG;
        try {
            const cfgPath = path.join(this.sessionPath, 'bot.config.json');
            if (fs.existsSync(cfgPath)) {
                const raw = fs.readFileSync(cfgPath, 'utf8');
                const parsed = JSON.parse(raw);
                loadedConfig = { ...DEFAULT_CONFIG, ...parsed, ai: { ...DEFAULT_CONFIG.ai, ...parsed.ai } };
            }
        } catch (err) { this.logger.warn({ err }, '[CONFIG] Gagal memuat file konfigurasi, menggunakan default.'); }

        const { isValid, validatedConfig } = ConfigValidator.validate(loadedConfig, DEFAULT_CONFIG);
        if (!isValid) logger.error("[CONFIG] Beberapa konfigurasi tidak valid, fungsionalitas mungkin terpengaruh.");

        return validatedConfig;
    }

    async _saveConfig() {
        try {
            await fs.promises.mkdir(this.sessionPath, { recursive: true });
            const cfgPath = path.join(this.sessionPath, 'bot.config.json');
            await fs.promises.writeFile(cfgPath, JSON.stringify(this.config, null, 2), 'utf8');
        } catch (err) { this.logger.error({ err }, '[CONFIG] Gagal menyimpan konfigurasi.'); }
    }

    _appendAudit(entry) {
        fs.appendFile(this.config.auditLogFile, `[${new Date().toISOString()}] ${JSON.stringify(entry)}\n`, (err) => {
            if (err) this.logger.warn({ err }, '[AUDIT] Gagal menulis ke audit log.');
        });
    }

    _updateLoggingProfile(sourceLevel) {
        this.dslmState = DSLM(sourceLevel);
        const { internal, external } = this.dslmState;
        Logger.setLevel(external);
        return { internal, external };
    }

    // --- Siklus Hidup & Inisialisasi ---
    async initialize() {
        this.logger.info('[CORE] Memulai sekuens inisialisasi Prometheus V13.1 (Resilient Core)...');
        this._updateLoggingProfile(this.logger.level);
        await fs.promises.mkdir(this.sessionPath, { recursive: true });

        await initializeCodebaseScanner(this.logger);
        await this.stateManager.loadAll();
        await this.commandManager.loadAll(this);
        startMetabolism();
        startWebServer(this.stateManager.state, aiState, this.logger);

        await this._connectToWhatsApp();
        this._startHomeostasisLoop();
        this.cliEngine.start();
    }

    // --- Manajemen Koneksi & Event ---
    async _connectToWhatsApp() {
        try {
            const { state: authState, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            const { version, isLatest } = await fetchLatestBaileysVersion();
            this.logger.info(`[BAILEYS] Menggunakan v${version.join('.')}, Terkini: ${isLatest}`);

            const { internal } = this.dslmState || this._updateLoggingProfile(this.logger.level);
            const waLogger = this.logger.child({ component: 'baileys', level: internal });

            this.sock = makeWASocket.default({
                version,
                auth: { creds: authState.creds, keys: makeCacheableSignalKeyStore(authState.keys, this.logger) },
                logger: waLogger,
                browser: Browsers.macOS('Chrome'),
                generateHighQualityLinkPreview: true,
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
                    if (requiresPatch) {
                        message = { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} }, ...message } } };
                    }
                    return message;
                },
                shouldIgnoreJid: (jid) => jid && jid.endsWith('@broadcast'),
                shouldSyncHistoryMessage: () => true,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
            });

            if (!this.sock.authState.creds.registered) {
                await this._askLoginMethodInteractive(this.sock);
            }

            this._registerAllEventListeners();
            this.sock.ev.on('creds.update', saveCreds);
            this._appendAudit({ event: 'connect_attempt' });
        } catch (err) {
            this.logger.error({ err }, '[BAILEYS] Gagal menginisialisasi koneksi.');
            await this._scheduleReconnect();
        }
    }

    _registerAllEventListeners() {
        if (!this.sock) return;

        this.sock.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
        this.sock.ev.on('creds.update', () => this.logger.debug('[CRED] Kredensial diperbarui.'));

        this.sock.ev.on('messages.upsert', (event) => {
            const startTime = performance.now();
            if (event.type === 'notify') {
                (async () => {
                    event.messages.forEach(msg => {
                        const sanitizedMsg = MessageSanitizer.sanitize(msg);
                        if (sanitizedMsg) {
                            try {
                                this.eventHandler.processMessage(msg);
                            } catch (err) {
                                this.cognitiveCore.update('error', 1);
                                this.logger.error({ err, msgKey: sanitizedMsg.key }, '[EVENT] Gagal menangani pesan.');
                            }
                        }
                    });
                })();
            }
            this.cognitiveCore.update('latency', performance.now() - startTime);
        });

        this.sock.ev.on('contacts.update', (updates) => this.logger.debug({ count: updates.length }, '[EVENT] Kontak diperbarui.'));
        this.sock.ev.on('group-participants.update', (update) => this._appendAudit({ event: 'group_participants_update', ...update }));
    }

    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'open') {
            this.operationalState = BOT_OPERATIONAL_STATE.RUNNING;
            this.logger.info('[KONEKSI] Koneksi berhasil tersambung. Status: RUNNING.');
            this.reconnectAttempts = 0;
            this._appendAudit({ event: 'connected' });
            if (this.autonomousTrigger) {
                this.autonomousTrigger.sock = this.sock;
                this.autonomousTrigger.start();
            }
        } else if (connection === 'close') {
            // [PERBAIKAN KRITIS] Cek apakah ini adalah bagian dari soft restart
            if (this.isSoftRestarting) {
                this.logger.info('[RESTART] Koneksi lama berhasil ditutup, melanjutkan proses restart.');
                return; // Hentikan eksekusi di sini agar tidak dianggap error
            }

            const reason = lastDisconnect?.error?.output?.statusCode;
            const isLoggedOut = reason === DisconnectReason.loggedOut;

            this.cognitiveCore.update('disconnect', reason);
            this.cognitiveCore._updateBeliefs(reason);
            if (this.autonomousTrigger) this.autonomousTrigger.stop();

            if (isLoggedOut) {
                // INI BAGIAN BARU: MASUK KE MODE SIAGA, JANGAN SHUTDOWN!
                this.operationalState = BOT_OPERATIONAL_STATE.FATAL_SESSION_ERROR;
                this.logger.fatal("==========================================================");
                this.logger.fatal(" KESALAHAN SESI KRITIS: LOGGED OUT ");
                this.logger.fatal(" Bot tidak dapat melanjutkan. Sesi Anda tidak valid lagi.");
                this.logger.fatal(" AKSI DIPERLUKAN: Hapus folder 'session' dan restart bot.");
                this.logger.fatal(" Bot akan tetap aktif dalam mode siaga menunggu perintah Anda.");
                this.logger.fatal("==========================================================");
                this._appendAudit({ event: 'logged_out', fatal: true });

                // Hentikan loop AI agar tidak terus berjalan
                if (this.healthTicker) clearInterval(this.healthTicker);

                return; // Hentikan proses reconnect, biarkan bot "diam".
            }

            // Jika bukan logged out, lanjutkan dengan logika reconnect
            this.operationalState = BOT_OPERATIONAL_STATE.RECONNECTING;
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) && reason !== DisconnectReason.connectionReplaced;

            if (shouldReconnect) {
                this.logger.warn(`[KONEKSI] Terputus. Mencoba menghubungkan kembali...`);
                this._scheduleReconnect();
            } else {
                this.logger.error({ err: lastDisconnect?.error }, `[KONEKSI] Koneksi ditutup karena alasan yang tidak bisa dipulihkan: ${DisconnectReason[reason] || reason}`);
                this.shutdown(true); // Hanya shutdown jika error benar-benar fatal (selain logged out)
            }
        }
    }

    async _scheduleReconnect() {
        // [PERBAIKAN] Tambahkan penjaga agar tidak reconnect saat sesi error fatal
        if (this.isShuttingDown || this.isSoftRestarting || this.operationalState === BOT_OPERATIONAL_STATE.FATAL_SESSION_ERROR) {
            this.logger.warn("[RECONNECT] Proses reconnect dibatalkan karena status bot tidak memungkinkan.");
            return;
        }

        await this.criticalOperationMutex.run(async () => {
            this.reconnectAttempts++;
            if (this.reconnectAttempts > this.config.maxReconnectAttempts) {
                this.logger.fatal(`[KONEKSI] Mencapai batas reconnect. Menyerah.`);
                return this.shutdown(true);
            }
            const delay = this.config.reconnectBaseDelayMs * (2 ** this.reconnectAttempts);
            this.logger.warn(`[KONEKSI] Menjadwalkan reconnect #${this.reconnectAttempts} dalam ${delay}ms...`);
            setTimeout(() => this._connectToWhatsApp(), delay);
        });
    }

    _questionWithTimeout(rl, query, timeoutMs = 30_000) {
        return new Promise((resolve) => {
            let answered = false;
            const t = setTimeout(() => {
                if (!answered) {
                    answered = true;
                    rl.close();
                    resolve(null);
                }
            }, timeoutMs);
            rl.question(query, (ans) => {
                if (answered) return;
                answered = true;
                clearTimeout(t);
                resolve(ans);
            });
        });
    }

    async _askLoginMethodInteractive(sock) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        try {
            const defaultMethod = this.config.preferredLoginMethod || 'qr';
            let raw;
            try {
                await delay(3000);
                raw = await this._questionWithTimeout(rl, `\n[SISTEM] Sesi tidak ditemukan. Pilih metode login (pair/qr) [default=${defaultMethod}]: `, 20_000);
            } catch (error) {
                throw new Error(`[ASK_LOGIN] ${error.message}\n${error.stack}`);
            };
            let method = (raw || defaultMethod)?.trim().toLowerCase();
            if (!['pair', 'qr'].includes(method)) {
                this.logger.warn('[LOGIN] Input tidak valid -> fallback ke QR.');
                method = 'qr';
            }

            if (method === 'pair') {
                const phRaw = await this._questionWithTimeout(rl, 'Masukkan nomor WhatsApp (cth: 62812xxxxxx): ', 20_000);
                const phone = (phRaw || '').replace(/\D/g, '');
                if (!/^[1-9][0-9]{7,14}$/.test(phone)) {
                    this.logger.error('[LOGIN] Nomor tidak valid, fallback ke QR.');
                    method = 'qr';
                } else {
                    try {
                        const pairingCode = await sock.requestPairingCode(phone);
                        this.logger.info(`[LOGIN] Pairing Code: ${pairingCode}`);
                        this.config.preferredLoginMethod = 'pair';
                        await this._saveConfig();
                        return;
                    } catch (err) {
                        this.logger.error({ err }, '[LOGIN] Gagal request pairing code, fallback ke QR.');
                        method = 'qr';
                    }
                }
            }
            this.logger.info('[LOGIN] Menunggu QR Code untuk dipindai.');
            this.config.preferredLoginMethod = 'qr';
            await this._saveConfig();
        } finally {
            if (!rl.closed) rl.close();
        }
    }

    // --- Monitor, CLI, & Operasi ---
    _startHomeostasisLoop() {
        if (this.healthTicker) clearInterval(this.healthTicker);
        this.healthTicker = setInterval(() => this.cognitiveCore.tick(), this.config.healthCheckIntervalMs);
        this.logger.info('[HEALTH] Loop Homeostasis AI aktif.');
    }

    async setLogLevel(newLevel) {
        if (!['debug', 'info', 'warn', 'error', 'fatal', 'silent'].includes(newLevel)) {
            this.logger.warn(`[DSLM] Level log tidak valid: '${newLevel}'`);
            return;
        }
        this._updateLoggingProfile(newLevel);
        this._appendAudit({ event: 'set_log_level', newLevel });
    }

    async softRestart() {
        await this.criticalOperationMutex.run(async () => {
            if (this.isSoftRestarting || this.isShuttingDown) return;
            this.logger.warn('[RESTART] Memulai prosedur soft restart...');

            // [PERBAIKAN KRITIS] Naikkan "bendera" sebelum mematikan koneksi
            this.isSoftRestarting = true;
            this._appendAudit({ event: 'soft_restart' });

            if (this.sock) {
                try {
                    // Gunakan Error biasa, bukan string, agar lebih standar
                    await this.sock.end(new Error('Soft Restart Triggered'));
                } catch (e) {
                    this.logger.warn({ err: e }, '[RESTART] Gagal menutup koneksi lama (mungkin sudah tertutup), melanjutkan proses.');
                }
            }
            try {
                await this.commandManager.loadAll(this);
                await this._connectToWhatsApp();
                this.logger.info('[RESTART] Soft restart berhasil diselesaikan.');
            } catch (err) {
                this.logger.error({ err }, '[RESTART] Gagal pada tahap restart.');
            } finally {
                // [PERBAIKAN KRITIS] Turunkan "bendera" setelah semua selesai
                this.isSoftRestarting = false;
            }
        });
    }

    async shutdown(isFatal = false) {
        await this.criticalOperationMutex.run(async () => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            const level = isFatal ? 'fatal' : 'warn';
            this.logger[level]('[SHUTDOWN] Memulai prosedur shutdown...');
            this._appendAudit({ event: 'shutdown', fatal: isFatal });

            // 1. Hentikan semua proses berulang
            if (this.healthTicker) clearInterval(this.healthTicker);
            if (this.autonomousTrigger) this.autonomousTrigger.stop();

            // 2. Coba simpan state (jika bukan fatal error, ini lebih penting)
            try {
                await this.stateManager.saveAll();
                this.logger.info('[SHUTDOWN] State berhasil disimpan.');
            } catch(e) {
                this.logger.error({ err: e }, '[SHUTDOWN] Gagal menyimpan state.');
            }

            // 3. Coba tutup koneksi socket dengan aman
            if (this.sock) {
                try {
                    await this.sock.end(undefined);
                    this.logger.info('[SHUTDOWN] Koneksi socket berhasil ditutup.');
                } catch(e) {
                    this.logger.warn({ err: e }, '[SHUTDOWN] Gagal menutup socket dengan normal (kemungkinan sudah tertutup).');
                }
            }

            // 4. Protokol Keluar (Exit Protocol)
            this.logger.info('[SHUTDOWN] Menjadwalkan terminasi proses.');
            if (isFatal) {
                // Untuk error fatal, jangan andalkan setTimeout. Lakukan flush sinkron dan keluar.
                this.logger.warn('[SHUTDOWN] Mode darurat: Keluar secara paksa.');
                Logger.shutdown(); // Coba flush logger sekali lagi
                process.exit(1);
            } else {
                // Untuk shutdown normal, beri waktu 1 detik untuk operasi I/O selesai.
                setTimeout(() => {
                    Logger.shutdown();
                    process.exit(0);
                }, 1000);
            }
        });
    }

    handleFatalError(error, origin) {
        // Fungsi ini harus sesederhana mungkin.
        // Tujuannya hanya untuk mencatat dan memicu shutdown darurat.
        const safeError = normalizeError(error);
        this.logger.fatal({ err: safeError, cognitiveState: this.cognitiveCore?.metrics }, `[FATAL] Terdeteksi di ${origin}.`);

        // Panggil shutdown dengan flag 'isFatal' = true
        if (!this.isShuttingDown) {
            this.shutdown(true);
        }
    }

    _setupProcessListeners() {
        process.on('uncaughtException', (err, origin) => this.handleFatalError(err, `Uncaught Exception: ${origin}`));
        process.on('unhandledRejection', (reason) => this.handleFatalError(reason, 'Unhandled Rejection'));
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }
}

function normalizeError(error) {
    if (error instanceof Error) return error;
    if (typeof error === 'object' && error !== null) {
        const newError = new Error(error.message || 'Objek error tidak standar');
        newError.stack = error.stack || (new Error()).stack;
        Object.assign(newError, error);
        return newError;
    }
    return new Error(`Error non-objek dilempar: ${util.format(error)}`);
}
