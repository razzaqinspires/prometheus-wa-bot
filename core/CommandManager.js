// core/CommandManager.js (V2.1 - Corrected Dependency Injection)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Pergi ke root direktori

export default class CommandManager {
    constructor(logger) {
        // [PERBAIKAN] Langsung gunakan logger yang sudah diinjeksi.
        // Logger ini sudah merupakan child logger dengan konteks yang benar.
        this.logger = logger;
        this.commands = new Map();
        this.aliases = new Map();
        this.commandsDir = path.join(__dirname, 'commands');
    }

    /**
    * Memuat atau memuat ulang semua file perintah dari direktori.
    * Membersihkan daftar perintah lama sebelum memuat yang baru.
    */
    async loadAll() {
        this.commands.clear();
        this.aliases.clear();
        this.logger.info('[CMD] Memuat semua modul perintah...');

        try {
            const categories = await fs.readdir(this.commandsDir);
            for (const category of categories) {
                const categoryPath = path.join(this.commandsDir, category);
                const stat = await fs.stat(categoryPath);

                if (stat.isDirectory()) {
                    const files = await fs.readdir(categoryPath);
                    for (const file of files.filter(f => f.endsWith('.js'))) {
                        try {
                            const filePath = path.join(categoryPath, file);
                            // Gunakan timestamp untuk cache-busting
                            const { default: command } = await import(`file://${filePath}?v=${Date.now()}`);

                            if (command?.name) {
                                command.category = category;
                                this.commands.set(command.name.toLowerCase(), command);
                                if (command.aliases && Array.isArray(command.aliases)) {
                                    command.aliases.forEach(alias => this.aliases.set(alias.toLowerCase(), command.name.toLowerCase()));
                                }
                            }
                        } catch (error) {
                            this.logger.error({ err: error }, `Gagal memuat perintah spesifik: ${file}`);
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error({ err: error }, `Gagal membaca direktori perintah: ${this.commandsDir}`);
        }

        this.logger.info(`[CMD] ${this.commands.size} perintah berhasil dimuat ke dalam memori.`);
    }

    /**
    * Mengambil sebuah modul perintah berdasarkan nama atau aliasnya.
    * @param {string} name - Nama perintah atau alias yang akan dicari.
    * @returns {object|undefined} Objek perintah jika ditemukan, jika tidak undefined.
    */
    getCommand(name) {
        if (!name) return undefined;
        const commandName = name.toLowerCase();
        return this.commands.get(commandName) || this.commands.get(this.aliases.get(commandName));
    }
}
