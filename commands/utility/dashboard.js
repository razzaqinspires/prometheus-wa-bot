// commands/utility/dashboard.js (V2.0 - Terintegrasi Penuh dengan State)

export default {
    name: 'dashboard',
    aliases: ['stats', 'status'],
    description: 'Menampilkan dasbor telemetri sistem.',
    category: 'Utility',

    async execute({ m, stateManager, aiState }) {
        const { systemStats } = stateManager.state;

        const createBar = (val, max, len = 10) => `[${'█'.repeat(Math.round(len*(val/max)))}${'░'.repeat(len - Math.round(len*(val/max)))}]`;

        const sortedCommands = Object.entries(systemStats.commandHits).sort(([,a],[,b])=>b-a).slice(0,5);

        let text = `*Dasbor Telemetri Prometheus V12.0*\n\n`;
        text += `*METABOLISME & KESADARAN*\n`;
        text += `- Mood: ${aiState.mood}\n`;
        text += `- Energi: \`${aiState.energy.toFixed(1)}%\` ${createBar(aiState.energy, 100)}\n`;
        text += `- Kelelahan: \`${aiState.fatigue.toFixed(1)}%\` ${createBar(aiState.fatigue, 100)}\n`;
        text += `- Detak Jantung: \`${Math.round(aiState.currentHeartRate)} BPM\`\n\n`;
        text += `*ANALITIK OPERASIONAL*\n`;
        text += `- Total Respons AI: ${systemStats.aiResponseHits}\n`;
        text += `- Total Perintah: ${Object.values(systemStats.commandHits).reduce((a,b)=>a+b,0)}\n\n`;
        text += `*PERINTAH SARAF (TOP 5)*\n`;
        if (sortedCommands.length > 0) {
            text += sortedCommands.map(([cmd, count]) => `  - \`${m.prefix}${cmd}\`: ${count}x`).join('\n');
        } else {
            text += `  _Belum ada data._\n`;
        }
        await m.reply(text);
    }
};
