// main.js (V8.0 - Bootstrapper dengan Layanan Terintegrasi)

import dotenv from 'dotenv';
dotenv.config();

import Bot from './core/Bot.js';
import Logger from './services/Logger.js';
import { TLM } from './services/tlm-level.js';

const logger = Logger.getLogger();

let bot = null;

(async () => {
    try {
        const initialLevel = process.env.LOG_LEVEL || 'warn';

        const finalLevel = TLM(initialLevel);

        Logger.setLevel(finalLevel);

        logger.info(`[CORE] Menjalankan Prometheus V8 (Direct Ignition Core)...`);
        logger.info(`[TLM] Level log awal '${initialLevel}' di-transformasi menjadi '${finalLevel}'.`);

        bot = new Bot();

        const shutdown = () => {
            logger.warn('[CORE] Sinyal shutdown diterima, memulai prosedur shutdown...');
            if (bot) {
                bot.shutdown();
            } else {
                process.exit(0);
            }
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        await bot.initialize();

        logger.info('[CORE] Inisialisasi selesai. Bot sekarang aktif dan berjalan di latar belakang.');

    } catch (error) {
        logger.fatal({ err: error }, 'Kegagalan kritis pada proses booting utama.');
        Logger.shutdown();
        process.exit(1);
    }
})();
