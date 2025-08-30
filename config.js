// config.js (V2.0 - Konfigurasi Terpusat & Modular)
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import os from 'os';

export default {
    botName: "Prometheus Prime",
    ownerNumbers: (process.env.OWNER_NUMBERS || "").split(','),
    prefixes: ["!", ".", "#", "/"],
    botMode: "public",

    commandsPerPage: 15,

    defaultStickerAuthor: "Prometheus",
    defaultStickerPack: "V11.0",

    paths: {
        session: path.join(process.cwd(), 'session'),
        data: path.join(process.cwd(), 'data'),
        temp: path.join(process.cwd(), 'tmp'),
        auditLog: path.join(os.homedir(), '.bot_audit.log'),
        bannedUsers: path.join(process.cwd(), 'data/bannedUsers.json'),
        registeredUsers: path.join(process.cwd(), 'data/registeredUsers.json'),
        rvomSettings: path.join(process.cwd(), 'data/rvomSettings.json'),
        exifDB: path.join(process.cwd(), 'data/exif.json'),
        learningCorpus: path.join(process.cwd(), 'data/learningCorpus.json'),
        systemStats: path.join(process.cwd(), 'data/systemStats.json'),
    },

    aiServices: [
        {
            id: "gemini",
            enabled: true,
            apiKey: (process.env.GEMINI_API_KEY || "").split(','),
            model: "gemini-pro",
            meta: {
                speed: 6,
                intelligence: 10,
                cost: 8,
                capabilities: ["reasoning", "creative", "long_context", "analysis"]
            }
        },
        {
            id: "openai",
            enabled: true,
            apiKey: (process.env.OPENAI_API_KEY || "").split(','),
            model: "gpt-3.5-turbo",
            meta: {
                speed: 8,
                intelligence: 8,
                cost: 5,
                capabilities: ["dialogue", "reasoning", "creative"]
            }
        },
        {
            id: "groq",
            enabled: true,
            apiKey: (process.env.GROQ_API_KEY || "").split(','),
            model: "llama3-8b-8192",
            meta: {
                speed: 10,
                intelligence: 7,
                cost: 3,
                capabilities: ["speed", "dialogue", "summarization"]
            }
        }
    ],
};
