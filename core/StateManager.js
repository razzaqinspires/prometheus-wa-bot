// core/StateManager.js (V2.1 - Corrected Dependency Injection)

import fs from 'fs/promises';
import path from 'path';

export default class StateManager {
    constructor(bot) {
        this.logger = bot.logger;

        this.paths = {
            systemStats: './data/systemStats.json',
            settings: './data/settings.json',
            premiumUsers: './data/premiumUsers.json',
            registeredUsers: './data/registeredUsers.json',
            bannedUsers: './data/bannedUsers.json',
            antilink: './data/antilink.json',
            rvom: './data/rvomSettings.json',
        };

        this.state = {
            systemStats: { commandHits: {}, aiResponseHits: 0 },
            settings: { botMode: 'public' },
            premiumUsers: [],
            registeredUsers: {},
            bannedUsers: {},
            antilink: {},
            rvom: {},
            startTime: new Date(),
            activeSessions: new Map(),
            cooldowns: new Map()
        };

        this.saveInterval = null;
    }

    async loadAll() {
        this.logger.info('[STATE] Memuat semua state persisten...');
        for (const key in this.paths) {
            try {
                const data = await fs.readFile(this.paths[key], 'utf-8');
                if (data) {
                    this.state[key] = JSON.parse(data);
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    this.logger.warn(`[STATE] File '${this.paths[key]}' tidak ditemukan, membuat file baru.`);
                    await this.save(key);
                } else {
                    this.logger.error({ err: error }, `Gagal memuat state '${key}'.`);
                }
            }
        }
        this.logger.info('[STATE] State berhasil disinkronkan ke memori.');
        this.saveInterval = setInterval(() => this.saveAll(), 5 * 60 * 1000);
    }

    async save(key) {
        if (!this.paths[key] || this.state[key] === undefined) return;
        try {
            await fs.writeFile(this.paths[key], JSON.stringify(this.state[key], null, 2));
        } catch (error) {
            this.logger.error({ err: error }, `Gagal menyimpan state '${key}' ke file.`);
        }
    }

    async saveAll() {
        this.logger.info('[STATE] Menyimpan semua state ke disk...');
        const savePromises = Object.keys(this.paths).map(key => this.save(key));
        await Promise.all(savePromises);
    }
}
