import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config.js';

export default {
    name: 'gemini',
    aliases: ['g', 'askg'],
    category: 'AI',
    description: 'Mengirimkan prompt langsung ke model AI Google Gemini-Pro.',
    usage: 'gemini <pertanyaan Anda>',

    async execute(context) {
        const { sock, m, text } = context;

        // 1. Ekstrak prompt dari pesan pengguna
        const prompt = text.trim();
        if (!prompt) {
            return m.reply(`⚠️ Harap berikan pertanyaan setelah perintah.\n\n*Contoh:*\n.gemini Siapakah Arifi Razzaq?`);
        }

        // 2. Cari konfigurasi Gemini dari config.js
        const geminiConfig = config.aiServices.find(p => p.id === 'gemini');

        // 3. Validasi konfigurasi
        if (!geminiConfig || !geminiConfig.enabled) {
            return m.reply('Layanan Gemini saat ini tidak diaktifkan.');
        }

        const apiKey = geminiConfig.apiKey[0];
        if (!apiKey) {
            return m.reply('API Key untuk Gemini tidak ditemukan. Harap periksa file config.js.');
        }

        try {
            // 4. Beri tahu pengguna bahwa permintaan sedang diproses
            await m.react('🧠');

            // 5. Inisialisasi dan panggil Gemini API
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: geminiConfig.model || "gemini-pro" });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();

            // 6. Kirim respons kembali ke pengguna
            await sock.sendMessage(m.from, { text: responseText }, { quoted: m.raw });
            await m.react('✅');

        } catch (error) {
            // 7. Tangani jika terjadi error
            console.error("Gemini Command Error:", error);
            await m.reply(`Terjadi anomali saat menghubungi sirkuit kognitif Gemini. Coba lagi nanti.\n\n*Detail Error:* \`\`\`${error.message}\`\`\``);
            await m.react('❌');
        }
    }
};
