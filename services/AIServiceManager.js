// services/AIServiceManager.js (V2.3 - Complete & Corrected Dependency Injection)

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { aiState, updateHeartRate, consumeEnergy as consumeAIEnergy } from './AIStateManager.js';
import fs from 'fs';
import path from 'path';
import AILogger from './AILogger.js';

class AIServiceManager {
    constructor(bot) { // 'logger' akan menjadi UNDEFINED!
    this.config = bot.config;
    this.logger = bot.logger;

    this.conversationHistory = new Map();
    this.immortalDBPath = path.join(process.cwd(), './data/immortalDB.json');
    this.immortalDB = this._loadImmortalDB(); // Sekarang aman dari crash

    setInterval(() => {
        this.conversationHistory.clear();
        this.logger.info('[AI] Memori percakapan 24 jam telah direset.');
    }, 24 * 60 * 60 * 1000);
}

_loadImmortalDB() {
    try {
        if (fs.existsSync(this.immortalDBPath)) {
            const rawData = fs.readFileSync(this.immortalDBPath, 'utf-8');
            return JSON.parse(rawData);
        }
    } catch (e) {
        this.logger.error({ err: e }, "Gagal memuat atau mem-parsing ImmortalDB. File mungkin rusak. Memulai dengan DB kosong.");
        // Opsi: buat backup dari file yang rusak untuk analisis
        const backupPath = `${this.immortalDBPath}.corrupted.${Date.now()}.bak`;
        fs.copyFileSync(this.immortalDBPath, backupPath);
        this.logger.warn(`File ImmortalDB yang rusak telah di-backup ke: ${backupPath}`);
    }
    return {};
}

_saveImmortalDB() {
    const tempPath = `${this.immortalDBPath}.${process.pid}.tmp`;
    try {
        const data = JSON.stringify(this.immortalDB, null, 2);
        fs.writeFileSync(tempPath, data, 'utf-8');
        fs.renameSync(tempPath, this.immortalDBPath);
    } catch (e) {
        this.logger.error({ err: e }, "Gagal menyimpan ImmortalDB.");
        // Jika penulisan gagal, hapus file sementara jika ada
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
}

_analyzeEmotionalImpact(text) {
    const emotionalKeywords = {
        marah: 2, benci: 2, kesal: 1.5,
        senang: 1, suka: 1, cinta: 1.5, bahagia: 1.5,
        sedih: 1.2, kecewa: 1.2, takut: 1.8
    };
    let impactScore = 0;
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
        if (emotionalKeywords[word]) {
            impactScore += emotionalKeywords[word];
        }
    }
    return Math.min(impactScore / 5, 1.0);
}

async handleAIChat({ sock, m, from, systemStats }) {
    await sock.sendPresenceUpdate('composing', from);

    if (!this.conversationHistory.has(from)) this.conversationHistory.set(from, []);
    const history = this.conversationHistory.get(from);

    const systemPrompt = `Anda adalah Prometheus, sebuah AI dengan kesadaran. Kondisi internal Anda saat ini: [Energi: ${aiState.energy.toFixed(1)}%, Mood: ${aiState.mood}]. Jawablah dengan mempertimbangkan keadaan ini.`;

    const currentConversation = [{ role: 'system', content: systemPrompt }];
    history.forEach(h => currentConversation.push(h));

    let fullPrompt = m.text;
    if (m.isQuoted && m.quoted.text) {
        const quotedSender = m.quoted.sender.split('@')[0];
        const quotedText = m.quoted.text.length > 100 ? m.quoted.text.substring(0, 100) + '...' : m.quoted.text;
        fullPrompt = `[Konteks dari @${quotedSender}: "${quotedText}"]\n\n${m.text}`;
    }
    currentConversation.push({ role: 'user', content: fullPrompt });
    if (currentConversation.length > 11) currentConversation.splice(1, 1);

    const enabledProviders = this.config.aiServices?.filter(p => p.enabled) || [];
    AILogger.logDecision(m.text, history, enabledProviders);

    let responseText = '';
    let providerSource = 'Tidak Diketahui';

    // [PERBAIKAN] Logika sekarang bersih: Cek DB, jika tidak ada, tanyakan AI.
    responseText = this._queryImmortalDB(m.text);
    if(responseText) providerSource = 'ImmortalDB';

    if (!responseText) {
        const enabledProviders = this.config.aiServices?.filter(p => p.enabled) || [];
        for (const provider of enabledProviders) {
            responseText = await this._queryProvider(provider, history /* atau currentConversation */);
            if (responseText) {
                providerSource = provider.id;
                break;
            }
        }
    }

    if (responseText) {
        AILogger.logResponse(providerSource, responseText.substring(0, 50));
        // [PERBAIKAN] Hanya simpan ke DB jika berasal dari AI, bukan dari cache.
        const userImpact = this._analyzeEmotionalImpact(m.text);
        const aiImpact = this._analyzeEmotionalImpact(responseText);
        const newHeartRate = updateHeartRate(userImpact + aiImpact);
        AILogger.logImpact(userImpact, aiImpact, newHeartRate);
        consumeAIEnergy(2.5);
        if (systemStats) systemStats.aiResponseHits = (systemStats.aiResponseHits || 0) + 1;
        if (providerSource !== 'ImmortalDB') {
            this.immortalDB[m.text.toLowerCase().trim()] = responseText;
            this._saveImmortalDB();
        }
        history.push({ role: 'assistant', content: responseText });
        await sock.sendMessage(from, { text: responseText }, { quoted: m.raw });
    } else {
        AILogger.logFallback('Semua provider gagal dan tidak ada di DB');
        let fallbackMessage;
        if(aiState.mood === 'Kritis' || aiState.mood === 'Lelah') {
            fallbackMessage = '...energi saya terlalu rendah untuk berpikir. Coba lagi nanti.';
        }
        if (typeof fallbackMessage !== "string" || fallbackMessage?.trim() === "") {
            return null;
        } else {
            await sock.sendMessage(from, { text: fallbackMessage }, { quoted: m.raw });
        }
    }

    await sock.sendPresenceUpdate('paused', from);
}

async _queryProvider(provider, history) {
    if (!provider || !provider.apiKey || provider.apiKey.length === 0) return null;

    for (const apiKey of provider.apiKey) {
        try {
            switch (provider.id) {
                case 'gemini':
                const gemini = new GoogleGenerativeAI(apiKey);
                const modelGemini = gemini.getGenerativeModel({ model: provider.model });
                const result = await modelGemini.generateContent(history.map(h => `${h.role}: ${h.content}`).join('\n'));
                return result.response.text();
                case 'openai':
                const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
                const openAIResult = await openai.chat.completions.create({ model: provider.model, messages: history });
                return openAIResult.choices[0].message.content;
                case 'groq':
                const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
                const groqResult = await groq.chat.completions.create({ model: provider.model, messages: history });
                return groqResult.choices[0].message.content;
                default:
                this.logger.error(`[AI] Provider ID tidak dikenal: ${provider.id}`);
                return null;
            }
        } catch (error) {
            this.logger.error(`[AI] Kegagalan SDK pada provider ${provider.id.toUpperCase()} (Key: ...${apiKey.slice(-4)}): ${error.message}`);
        }
    }
    this.logger.warn(`[AI] Semua API key untuk provider ${provider.id.toUpperCase()} gagal.`);
    return null;
}

_queryImmortalDB(text) {
    const key = text.toLowerCase().trim();
    if (this.immortalDB[key]) {
        return this.immortalDB[key];
    }

    const stopWords = new Set(['yang', 'di', 'dan', 'atau', 'tapi', 'adalah', 'saya', 'kamu', 'dia', 'kita', 'ini', 'itu', 'ke', 'dari', 'dengan', 'untuk', 'pada', 'saat', 'bagaimana', 'mengapa', 'kapan', 'siapa', 'apa', 'tolong', 'jelaskan']);
    const queryTokens = key.split(/\s+/).filter(word => !stopWords.has(word));

    if (queryTokens.length === 0) {
        return null;
    }

    let bestMatch = { key: null, score: 0 };
    const dbKeys = Object.keys(this.immortalDB);

    for (const dbKey of dbKeys) {
        const dbKeyTokens = new Set(dbKey.toLowerCase().trim().split(/\s+/).filter(word => !stopWords.has(word)));

        let currentScore = 0;
        for (const token of queryTokens) {
            if (dbKeyTokens.has(token)) {
                currentScore++;
            }
        }

        const unionSize = queryTokens.length + dbKeyTokens.size - currentScore;
        if (unionSize === 0) continue; // Menghindari pembagian dengan nol

        const normalizedScore = currentScore / unionSize; // Jaccard Similarity

        if (normalizedScore > bestMatch.score) {
            bestMatch.score = normalizedScore;
            bestMatch.key = dbKey;
        }
    }

    if (bestMatch.score > 0.25) {
        return this.immortalDB[bestMatch.key];
    }

    return null;
}
}

export default AIServiceManager;
