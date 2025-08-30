// services/Logger.js (V2.2 - Resilient & Self-Validating)
import pino from 'pino';
import pinoMultiStream from 'pino-multi-stream';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));
const logDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

class LoggerService {
    static #instance;
    #logger;
    #streams = [];

    constructor() {
        const logLevel = process.env.LOG_LEVEL || 'info';
        const logToFile = process.env.LOG_TO_FILE === 'true';
        const isProduction = process.env.NODE_ENV === 'production';

        // 1. Console Stream
        if (isProduction) {
            this.#streams.push({ level: logLevel, stream: process.stdout });
        } else {
            this.#streams.push({
                level: logLevel,
                stream: pino.transport({
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                        ignore: 'pid,hostname',
                    },
                }),
            });
        }

        // 2. File Streams
        if (logToFile) {
            this.#streams.push({ level: logLevel, stream: pino.destination({ dest: path.join(logDir, 'all.log'), minLength: 4096, sync: false }) });
            this.#streams.push({ level: 'error', stream: pino.destination({ dest: path.join(logDir, 'error.log'), minLength: 0, sync: true }) });
        }

        this.#logger = pino({ level: logLevel }, pinoMultiStream.multistream(this.#streams));
        this.#logger.info(`[Logger] Layanan Logger diinisialisasi. Level: ${logLevel}, Log ke file: ${logToFile}, Produksi: ${isProduction}`);
    }

    /**
    * [PENINGKATAN] Membersihkan konteks dari referensi sirkular sebelum logging.
    * @param {object} context Objek konteks.
    * @returns {object} Konteks yang aman.
    */
    #sanitizeContext(context) {
        try {
            // Cara cepat dan efektif untuk memutus referensi sirkular
            return JSON.parse(JSON.stringify(context));
        } catch (error) {
            this.#logger.warn("[LOGGER_SANITIZE] Gagal membersihkan konteks, kemungkinan ada referensi sirkular. Konteks akan diabaikan.");
            return { contextError: "Circular reference detected" };
        }
    }

    /**
    * [PENINGKATAN] Memberi "cap" pada logger untuk validasi.
    * @param {pino.Logger} loggerInstance Instance pino.
    * @returns {pino.Logger} Instance pino dengan properti brand.
    */
    #brandLogger(loggerInstance) {
        Object.defineProperty(loggerInstance, '_isPrometheusLogger', {
            value: true,
            writable: false,
            enumerable: false, // Sembunyikan dari JSON.stringify
        });
        return loggerInstance;
    }

    static getInstance() {
        if (!LoggerService.#instance) {
            LoggerService.#instance = new LoggerService();
        }
        return LoggerService.#instance;
    }

    getLogger() {
        return this.#brandLogger(this.#logger);
    }

    createChildLogger(context) {
        if (typeof context !== 'object' || context === null) {
            return this.#brandLogger(this.#logger.child({}));
        }
        const safeContext = this.#sanitizeContext(context);
        return this.#brandLogger(this.#logger.child(safeContext));
    }

    setLevel(newLevel) {
        this.#logger.level = newLevel;
        this.#logger.info(`[Logger] Level log diubah secara dinamis ke: '${newLevel}'`);
    }

    shutdown() {
        this.getLogger().info('[Logger] Memulai graceful shutdown untuk logger...');
        const stream = this.getLogger()[pino.symbols.streamSym];
        if (stream && typeof stream.flushSync === 'function') {
            stream.flushSync();
        }
        this.getLogger().info('[Logger] Semua log berhasil di-flush.');
    }
}

export default LoggerService.getInstance();
