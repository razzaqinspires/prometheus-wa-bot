// commands/owner/mode.js (V2.0 - Menyimpan ke State Persisten)

export default {
    name: 'mode',
    usage: 'mode <self|public>',
    category: 'Owner',
    description: 'Mengubah mode operasional bot.',
    permission: { restriction: ['owner'] },

    async execute({ m, args, stateManager }) {
        const newMode = args[0]?.toLowerCase();
        const currentMode = stateManager.state.settings.botMode;

        if (newMode !== 'self' && newMode !== 'public') {
            return m.reply(`Mode tidak valid. Gunakan: .mode self atau .mode public\n\nMode saat ini: *${currentMode}*`);
        }
        if (newMode === currentMode) {
            return m.reply(`[SISTEM] Mode operasional sudah diatur ke *${newMode}*.`);
        }

        stateManager.state.settings.botMode = newMode;
        // Simpan perubahan agar persisten
        await stateManager.save('settings');

        await m.reply(`[SISTEM] Mode operasional telah diubah ke *${newMode.toUpperCase()}*.`);
    }
};
