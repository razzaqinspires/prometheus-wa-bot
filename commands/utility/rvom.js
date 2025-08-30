// commands/moderation/rvom.js (V2.0 - Menggunakan StateManager)

export default {
    name: 'rvom',
    category: 'Moderation',
    description: 'Mengaktifkan/menonaktifkan mode arsip otomatis pesan sekali lihat.',
    usage: 'rvom <on|off>',
    permission: { restriction: [['group', 'admin']] },

    async execute({ m, args, stateManager }) {
        const mode = args[0]?.toLowerCase();
        const settings = stateManager.state.rvom || {};

        if (!['on', 'off'].includes(mode)) {
            const currentMode = settings[m.from] ? 'ON' : 'OFF';
            return m.reply(`Gunakan: .rvom on|off. Mode saat ini: *${currentMode}*`);
        }

        const isEnabled = mode === 'on';
        if (!!settings[m.from] === isEnabled) {
            return m.reply(`[SISTEM] Mode sudah dalam status *${isEnabled ? 'AKTIF' : 'NONAKTIF'}*.`);
        }

        settings[m.from] = isEnabled;
        stateManager.state.rvom = settings;
        await stateManager.save('rvom');

        await m.reply(`👁️ Mode pengawasan otomatis diatur ke: *${isEnabled ? 'AKTIF' : 'NONAKTIF'}*`);
    }
};
