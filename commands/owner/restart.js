// commands/owner/restart.js (V2.1 - Centralized Permissions)

export default {
    name: 'restart',
    aliases: ['reboot'],
    description: 'Melakukan soft restart pada entitas bot.',
    category: 'Owner',

    // [PERBAIKAN UTAMA] Mengatur izin ke 'owner' dan menghapus prompt yang salah.
    permission: {
        restriction: ['owner']
    },

    async execute({ m, bot }) {
        // [DIHAPUS] Pemeriksaan 'isOwner' manual tidak diperlukan lagi.
        // const isOwner = config.ownerNumbers.includes(m.sender.split('@')[0]);
        // if (!isOwner) return;

        await m.reply('[SISTEM] Menerima sinyal restart... Memulai prosedur soft restart. Mohon tunggu...');

        // Memanggil metode restart yang aman dari instance bot.
        await bot.softRestart();
    }
};
