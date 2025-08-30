// commands/utility/ping.js (V3.1 - Progresif & Stabil)

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Helper untuk memformat bps menjadi Mbps
function formatSpeed(bitsPerSecond) {
    if (typeof bitsPerSecond !== 'number' || !isFinite(bitsPerSecond)) return 'N/A';
    const megabitsPerSecond = bitsPerSecond / 1e6;
    return megabitsPerSecond.toFixed(2);
}

// Fungsi untuk memberikan jeda
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'ping',
    aliases: ['p', 'speedtest'],
    usage: 'ping',
    category: 'Utility',
    description: 'Mengukur latensi, kecepatan respon, dan kecepatan jaringan sistem via sub-proses Python.',

    async execute({ sock, m }) {
        const initialLatency = Date.now() - (m.raw.messageTimestamp * 1000);

        // Tahapan progresif untuk pembaruan visual
        const stages = [
            'Menginisialisasi sub-proses Python...',
            'Mencari server optimal...',
            'Menganalisis latensi jaringan...',
            'Mengukur throughput unduh...',
            'Mengukur throughput unggah...',
            'Menyusun laporan akhir...'
        ];
        const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let stageIndex = 0;
        let isDone = false;

        // Kirim pesan awal
        const initialText = `[ ${spinner[0]} ] ${stages[0]}`;
        const sentMsg = await m.reply(initialText);

        // Fungsi untuk mengelola pembaruan visual secara terpisah
        const updateVisuals = async () => {
            while (!isDone) {
                stageIndex = (stageIndex + 1) % stages.length;
                const spinnerText = `[ ${spinner[stageIndex % spinner.length]} ] ${stages[stageIndex]}`;

                // Mengirim pembaruan hanya jika teksnya berbeda untuk efisiensi
                sock.relayMessage(m.from, {
                    protocolMessage: { key: sentMsg.key, type: 14, editedMessage: { conversation: spinnerText } }
                }, {}).catch(() => {
                    // Jika gagal (misal, pesan dihapus), hentikan loop
                    isDone = true;
                });

                // [PERBAIKAN UTAMA] Jeda 1.5 detik antar pembaruan untuk menghindari rate limit
                await delay(1500);
            }
        };

        // Jalankan pembaruan visual dan speedtest secara bersamaan
        const visualPromise = updateVisuals();

        let finalText;
        try {
            // Jalankan perintah speedtest-cli
            const { stdout } = await execPromise('speedtest-cli --json');
            const st = JSON.parse(stdout);

            const downloadSpeed = formatSpeed(st.download);
            const uploadSpeed = formatSpeed(st.upload);

            finalText = `╭─╶「 *Laporan Diagnostik Jaringan* 」\n`;
            finalText += `│  💻 *Host:* ${st.server.name} (${st.server.country})\n`;
            finalText += `│  ⚡️ *Latensi Bot:* ${initialLatency} ms\n`;
            finalText += `│  🛰️ *Latensi Jaringan:* ${st.ping.toFixed(2)} ms\n`;
            finalText += `│  📥 *Kecepatan Unduh:* ${downloadSpeed} Mbps\n`;
            finalText += `│  📤 *Kecepatan Unggah:* ${uploadSpeed} Mbps\n`;
            finalText += `╰─╶\n\n`;
            finalText += `*ISP:* ${st.client.isp}`;

        } catch (error) {
            finalText = `[ANOMALI SUB-PROSES] Gagal mengeksekusi speedtest-cli.\n\n`;
            finalText += `Pastikan *Python* dan *speedtest-cli* terinstal pada sistem Anda.\n`;
            finalText += `Jalankan: \`pkg install python && pip install speedtest-cli\`\n\n`;
            finalText += `*Pesan Error:* \`\`\`${error.message}\`\`\``;
        } finally {
            // Hentikan loop pembaruan visual
            isDone = true;
        }

        // Tunggu promise visual selesai (opsional, untuk kebersihan)
        await visualPromise;

        // Kirim hasil akhir
        await sock.relayMessage(m.from, {
            protocolMessage: { key: sentMsg.key, type: 14, editedMessage: { conversation: finalText } }
        }, {});
    }
};
