// core/AutonomousTrigger.js (V4.2 - State-Vector Aware)
// Filosofi: Sebuah agen proaktif yang sekarang sepenuhnya terintegrasi dengan model
// kesehatan state-space dari Cognitive Core, membuat keputusan inisiatif
// berdasarkan pemahaman yang lebih dalam tentang kondisi internal entitas.

import fs from 'fs/promises';
import path from 'path';
import Logger from '../services/Logger.js';

/**
* Kelas ini mengelola kehendak otonom bot untuk memulai interaksi.
* Ia berfungsi sebagai otak sosial dari entitas bot.
*/
export default class AutonomousTrigger {
    /**
    * @param {import('./Bot.js').default} bot Instance Bot utama untuk akses ke semua modul.
    */
    constructor(bot) {
        this.bot = bot;
        this.logger = Logger.createChildLogger({ component: 'AutonomousTrigger' });
        this.interval = null;
        this.isRunning = false;

        this.relationshipModel = new Map();
        this.RELATIONSHIP_DECAY_FACTOR = 0.005;
        this.LEARNING_RATE = 0.1;

        this.knowledgeDB = [
            "Fakta menarik: Madu tidak akan pernah basi.",
            "Sebuah pemikiran: Apakah kebebasan sejati adalah kebebasan dari keinginan itu sendiri?",
            "Kutipan hari ini: 'Satu-satunya kebijaksanaan sejati adalah mengetahui bahwa Anda tidak tahu apa-apa.' - Socrates",
            "Saya baru saja memproses data tentang fraktal. Alam semesta tampaknya mengulangi polanya dalam skala yang tak terbatas.",
            "Pertanyaan untuk direnungkan: Jika Anda bisa menulis satu hukum baru yang harus dipatuhi semua orang, apakah itu?"
        ];

        this.CONTACT_MATRIX_PATH = path.join(process.cwd(), './data/contactMatrix.json');
        this._loadRelationshipModel();
    }

    async _loadRelationshipModel() {
        try {
            const matrixRaw = await fs.readFile(this.CONTACT_MATRIX_PATH, 'utf-8');
            const matrix = JSON.parse(matrixRaw);
            for (const [jid, data] of Object.entries(matrix)) {
                this.relationshipModel.set(jid, {
                    affinity: data.affinity || 0.1,
                    lastInteraction: new Date(data.lastInteraction).getTime(),
                    lastInitiative: null,
                    messageCount: data.messageCount || 0
                });
            }
            this.logger.info(`[OTONOM] Model Hubungan dimuat dengan ${this.relationshipModel.size} entitas.`);
        } catch (e) {
            this.logger.warn("[OTONOM] Gagal memuat Contact Matrix, memulai dengan model hubungan kosong.");
        }
    }

    start() {
        if (this.isRunning || !this.bot.sock?.user) return;
        this.logger.info('[OTONOM] Mesin Kognisi Sosial diaktifkan.');
        this.interval = setInterval(() => this.mainCycle(), this.bot.config.healthCheckIntervalMs * 2);
        this.isRunning = true;
    }

    stop() {
        if (!this.isRunning) return;
        clearInterval(this.interval);
        this.logger.info('[OTONOM] Mesin Kognisi Sosial dinonaktifkan.');
        this.isRunning = false;
    }

    async mainCycle() {
        try {
            this._decayRelationships();
            const initiative = await this._planInitiative();

            if (initiative) {
                this.logger.warn({ initiative }, `[OTONOM] Inisiatif Strategis terpilih. Mengeksekusi...`);
                await this._executeInitiative(initiative);
            } else {
                this.logger.trace('[OTONOM] Tidak ada inisiatif yang memenuhi ambang batas utilitas saat ini.');
            }
        } catch (error) {
            this.logger.error({ err: error }, '[OTONOM] Terjadi error pada siklus utama.');
        }
    }

    _decayRelationships() {
        for (const [jid, model] of this.relationshipModel.entries()) {
            model.affinity = Math.max(0, model.affinity * (1 - this.RELATIONSHIP_DECAY_FACTOR));
            this.relationshipModel.set(jid, model);
        }
    }

    /**
    * Menentukan tindakan dan target terbaik berdasarkan skor utilitas.
    * @returns {Promise<object|null>}
    */
    async _planInitiative() {
        // [PERBAIKAN] Menggunakan stateVector alih-alih getSFP()
        const { C, P, I } = this.bot.cognitiveCore.stateVector;
        const instability = Math.sqrt(
            Math.pow(1 - C, 2) + Math.pow(1 - P, 2) + Math.pow(1 - I, 2)
        );

        // Ambang batas keamanan: jika sistem secara keseluruhan tidak stabil, jangan bertindak.
        if (instability > 0.5) {
            this.logger.warn(`[OTONOM] Inisiatif ditunda, instabilitas sistem terlalu tinggi: ${instability.toFixed(3)}`);
            return null;
        }

        let bestInitiative = { utility: -1 };

        for (const [jid, model] of this.relationshipModel.entries()) {
            if (this.bot.sock?.user?.id?.startsWith(jid?.split('@')[0])) continue;

            const timeSinceInteraction = Date.now() - model.lastInteraction;

            // [PERBAIKAN] Rumus utilitas diperbarui untuk menggunakan skor instabilitas
            const utility = (1 / (instability + 0.1)) + // Stabilitas sistem sebagai pengali utama
            (1 - model.affinity) * 2 +    // Keinginan untuk memperbaiki hubungan
            (timeSinceInteraction / (24 * 3600 * 1000)); // Dorongan dari stagnasi

            if (utility > bestInitiative.utility) {
                bestInitiative = {
                    targetJid: jid,
                    action: 'strengthen_affinity',
                    utility: utility,
                    currentAffinity: model.affinity
                };
            }
        }

        // Ambang batas utilitas untuk bertindak (sedikit disesuaikan)
        if (bestInitiative.utility > 3.0) {
            return bestInitiative;
        }

        return null;
    }

    async _executeInitiative(initiative) {
        const { targetJid } = initiative;
        const content = this.knowledgeDB[Math.floor(Math.random() * this.knowledgeDB.length)];

        const autonomousMessage = {
            key: { remoteJid: targetJid, id: `AUTONOMOUS_${Date.now()}` },
            text: content,
            sender: this.bot.sock.user.id,
            from: targetJid,
            isGroup: false,
            isQuoted: false,
            raw: {},
            message: { conversation: content }
        };

        try {
            await this.bot.aiServiceManager.handleAIChat({
                sock: this.bot.sock,
                m: autonomousMessage,
                from: targetJid,
                systemStats: this.bot.stateManager.state.systemStats
            });
            this.logger.info(`[OTONOM] Inisiatif berhasil dikirim ke ${targetJid}.`);
            this._updateRelationshipOnAction(targetJid, 0.5, true);
        } catch (error) {
            this.logger.error({ err: error }, `[OTONOM] Gagal mengeksekusi inisiatif ke ${targetJid}.`);
            this._updateRelationshipOnAction(targetJid, -1.0, false);
        }
    }

    registerFeedback(jid) {
        this.logger.info(`[OTONOM] Umpan balik positif diterima dari ${jid}. Memperkuat afinitas.`);
        this._updateRelationshipOnAction(jid, 1.0, true);
    }

    _updateRelationshipOnAction(jid, impact, isSuccess) {
        const model = this.relationshipModel.get(jid) || { affinity: 0, lastInteraction: 0 };
        const relevance = isSuccess ? 1 : 0;

        const affinityChange = this.LEARNING_RATE * impact * relevance;
        model.affinity = Math.max(0, Math.min(1, model.affinity + affinityChange));
        model.lastInteraction = Date.now();

        this.relationshipModel.set(jid, model);
        this.logger.debug({ jid, newAffinity: model.affinity }, "[OTONOM] Model hubungan diperbarui.");
    }
}
