// core/CLIEngine.js (V1.1 - Defensive & Resilient Command Handling)
// Perbaikan: Menambahkan pengecekan keamanan untuk konfigurasi prefixes
// untuk mencegah crash saat menampilkan menu di CLI.

import readline from 'readline';
import os from 'os';
import { aiState } from '../services/AIStateManager.js';
import Logger from '../services/Logger.js';

// --- Helper Functions ---
const helpers = {
    formatBytes: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    },
    createBar: (val, max, len = 10, char = '█', empty = '░') => {
        const p = Math.max(0, Math.min(1, val / max));
        const prog = Math.round(len * p);
        return `[${char.repeat(prog)}${empty.repeat(len - prog)}]`;
    }
};

export default class CLIEngine {
    /**
    * @param {import('./Bot.js').default} bot Instance Bot utama.
    */
    constructor(bot) {
        this.bot = bot;
        this.logger = bot.logger;
        this.rl = null;
        this.liveStatusInterval = null;
        this.isLogPaused = false;
        this.previousLogLevel = 'info';
        this.commands = new Map();
        this._registerCommands();
    }

    _registerCommands() {
        this.commands.set('status', { description: 'Tampilkan status bot. Gunakan --live untuk mode real-time.', handler: this.handleStatusCommand.bind(this) });
        this.commands.set('menu', { description: 'Tampilkan daftar perintah yang tersedia di bot.', handler: this.handleMenuCommand.bind(this) });
        this.commands.set('ai', { description: 'Berinteraksi langsung dengan AI. Contoh: ai halo, apa kabarmu?', handler: this.handleAICommand.bind(this) });
        this.commands.set('log', { description: 'Kontrol output log. Sub-perintah: pause, resume, level <lvl>.', handler: this.handleLogCommand.bind(this) });
        this.commands.set('restart', { description: 'Melakukan soft restart pada bot.', handler: () => this.bot.softRestart() });
        this.commands.set('shutdown', { description: 'Mematikan bot secara aman.', handler: () => this.bot.shutdown() });
        this.commands.set('exit', { description: 'Alias untuk shutdown.', handler: () => this.bot.shutdown() });
        this.commands.set('close', { description: 'Alias untuk shutdown.', handler: () => this.bot.shutdown() });
    }

    start() {
        this.rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        this.logger.info('[CLI] Pusat Komando & Kontrol aktif. Ketik `help` untuk daftar perintah.');

        this.rl.on('line', async (input) => {
            if (this.liveStatusInterval) {
                return this._stopLiveStatus();
            }
            try {
                const [cmd, ...args] = input.trim().split(/\s+/);
                if (!cmd) return this.rl.prompt();

                const command = this.commands.get(cmd.toLowerCase());
                if (command) {
                    await command.handler(args, input.trim());
                } else if (cmd.toLowerCase() === 'help') {
                    console.log("\n--- Perintah CLI yang Tersedia ---");
                    this.commands.forEach((value, key) => {
                        console.log(`  - ${key.padEnd(10)}: ${value.description}`);
                    });
                    console.log("");
                }
                else {
                    this.logger.warn(`[CLI] Perintah tidak dikenal: ${cmd}. Ketik 'help' untuk bantuan.`);
                }
            } catch (err) {
                this.logger.error({ err }, '[CLI] Gagal mengeksekusi perintah.');
            }
            if (!this.liveStatusInterval) this.rl.prompt();
        });

        this.rl.setPrompt('> ');
        this.rl.prompt();
    }

    // --- Command Handlers ---

    handleStatusCommand(args) {
        if (args.includes('--live')) {
            this._startLiveStatus();
        } else {
            console.log(this._getFormattedStatus());
        }
    }

    handleMenuCommand() {
        console.log("\n--- Daftar Perintah Bot (dari CommandManager) ---");

        // [PERBAIKAN] Pengecekan defensif untuk prefixes
        const displayPrefix = this.bot.config?.prefixes?.[0] || '.';

        const categories = {};
        if (!this.bot.commandManager || !this.bot.commandManager.commands) {
            console.log("CommandManager belum siap atau tidak ada perintah yang dimuat.");
            return;
        }

        this.bot.commandManager.commands.forEach(cmd => {
            const cat = cmd.category || 'Lainnya';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.name);
        });

        for (const cat in categories) {
            console.log(`\n[ ${cat.toUpperCase()} ]`);
            console.log(categories[cat].map(cmd => `  - ${displayPrefix}${cmd}`).join('\n'));
        }
        console.log("");
    }

    async handleAICommand(args) {
        if (args.length === 0) return console.log("Penggunaan: ai <pertanyaan Anda>");

        const prompt = args.join(' ');
        const mockMsg = {
            text: prompt,
            from: 'cli@localhost',
            sender: 'cli@localhost',
            isGroup: false,
            isQuoted: false,
            reply: (text) => console.log(`\n[AI RESPONSE]: ${text}`),
        };

        console.log("\n[CLI->AI] Mengirim prompt...");
        await this.bot.aiServiceManager.handleAIChat({
            sock: this.bot.sock,
            m: mockMsg,
            from: 'cli@localhost',
            systemStats: this.bot.stateManager.state.systemStats
        });
    }

    handleLogCommand(args) {
        const subCmd = args[0]?.toLowerCase();
        if (subCmd === 'pause') {
            if (!this.isLogPaused) {
                this.previousLogLevel = Logger.getLogger().level;
                Logger.setLevel('silent');
                this.isLogPaused = true;
                console.log("Output log di terminal dijeda.");
            }
        } else if (subCmd === 'resume') {
            if (this.isLogPaused) {
                Logger.setLevel(this.previousLogLevel);
                this.isLogPaused = false;
                console.log(`Output log dilanjutkan (level: ${this.previousLogLevel}).`);
            }
        } else if (subCmd === 'level' && args[1]) {
            const newLevel = args[1].toLowerCase();
            if (['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'].includes(newLevel)) {
                Logger.setLevel(newLevel);
                this.previousLogLevel = newLevel;
                console.log(`Level log diatur ke: ${newLevel}`);
            } else {
                console.log("Level tidak valid. Pilihan: trace, debug, info, warn, error, fatal, silent.");
            }
        } else {
            console.log("Gunakan: log <pause|resume|level <level>>");
        }
    }

    // --- Live Status Logic ---

    _startLiveStatus() {
        if (this.liveStatusInterval) return;
        this.liveStatusInterval = setInterval(() => {
            readline.cursorTo(process.stdout, 0, 0);
            readline.clearScreenDown(process.stdout);
            process.stdout.write(this._getFormattedStatus());
        }, 1000);
        console.log("--- Menampilkan Status Live --- (Tekan Enter untuk berhenti)");
    }

    _stopLiveStatus() {
        clearInterval(this.liveStatusInterval);
        this.liveStatusInterval = null;
        console.clear();
        this.logger.info("Mode status live dihentikan.");
        this.rl.prompt();
    }

    _getFormattedStatus() {
        const { cognitiveCore, stateManager, config, sock } = this.bot;
        const { C, P, I } = cognitiveCore.stateVector;
        const health = (C + P + I) / 3 * 100;
        const cpuUsage = os.loadavg()[0].toFixed(2);
        const mem = process.memoryUsage();
        let status = `\n--- [ DASBOR ENTITAS PROMETHEUS V13 ] ---\n\n`;
        status += `  [ KONEKSI ]\n`;
        status += `  - Status      : ${sock?.user ? 'TERHUBUNG' : 'TERPUTUS'}\n`;
        status += `  - Percobaan   : ${this.bot.reconnectAttempts}\n`;
        status += `  - Kepercayaan : Jaringan=${cognitiveCore.bayesianBeliefs.NetworkIssue.toFixed(2)} | Platform=${cognitiveCore.bayesianBeliefs.PlatformIssue.toFixed(2)}\n\n`;
        status += `  [ KOGNITIF & HOMEOSTASIS ]\n`;
        status += `  - Vektor (C,P,I) : [${C.toFixed(2)}, ${P.toFixed(2)}, ${I.toFixed(2)}]\n`;
        status += `  - Kesehatan      : ${helpers.createBar(health, 100, 20, '💚', '💔')} ${health.toFixed(1)}%\n`;
        status += `  - Energi         : ${helpers.createBar(aiState.energy, 100, 20)} ${aiState.energy.toFixed(1)}%\n`;
        status += `  - Kelelahan      : ${helpers.createBar(aiState.fatigue, 100, 20)} ${aiState.fatigue.toFixed(1)}%\n`;
        status += `  - Detak Jantung  : ${Math.round(aiState.currentHeartRate)} BPM\n\n`;
        status += `  [ SISTEM & SUMBER DAYA ]\n`;
        status += `  - Memori (RSS)   : ${helpers.formatBytes(mem.rss)}\n`;
        status += `  - Beban CPU (1m) : ${cpuUsage}%\n`;
        status += `  - Server Web     : Aktif di port ${config.webPort || 8081}\n`;
        return status;
    }
}
