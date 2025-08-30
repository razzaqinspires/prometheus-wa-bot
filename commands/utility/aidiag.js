// commands/utility/aidiag.js (V2.0 - SDK Based, Lengkap)

import config from '../../config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

export default {
    name: 'aidiag',
    aliases: ['aidebug'],
    usage: 'aidiag',
    category: 'Utility',
    description: 'Menjalankan diagnostik aktif pada semua provider AI.',
    permission: { restriction: ['premium'] },

    async execute({ sock, m }) {
        await m.reply('[SISTEM] Memulai diagnostik aktif... Laporan mentah akan dikirimkan.');

        let report = `*Laporan Diagnostik Kognitif Prometheus v9.0*\n\n`;

        for (const provider of config.aiServices) {
            if (!provider.enabled) {
                report += `*Provider: ${provider.id.toUpperCase()}*\n- Status: DINONAKTIFKAN\n\n`;
                continue;
            }

            report += `*Provider: ${provider.id.toUpperCase()}*\n- Model: ${provider.model}\n`;

            try {
                const apiKey = provider.apiKey[0];
                if (!apiKey) throw new Error('API Key tidak ditemukan di config.');

                switch (provider.id) {
                    case 'gemini':
                    const gemini = new GoogleGenerativeAI(apiKey);
                    const model = gemini.getGenerativeModel({ model: "gemini-pro" }); // Gunakan model dasar untuk tes
                    await model.countTokens("test");
                    break;

                    case 'openai':
                    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
                    await openai.models.list();
                    break;

                    case 'groq':
                    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
                    await groq.models.list();
                    break;

                    default:
                    throw new Error(`Provider ID "${provider.id}" tidak dikenal oleh diagnostik.`);
                }

                report += `- Status: *BERHASIL* (Koneksi dan otentikasi SDK valid)\n`;

            } catch (error) {
                report += `- Status: *GAGAL*\n`;
                report += `  - Tipe: SDK Error\n`;
                report += `  - Pesan: \`\`\`${error.message}\`\`\`\n`;
            }
            report += `\n`;
        }

        await sock.sendMessage(m.sender, { text: report });
    }
};
