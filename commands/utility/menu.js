// commands/utility/menu.js (V5.2 - Self-Documenting & Contextual Help)
// Peningkatan: Merombak sub-perintah 'set' untuk menyediakan panduan
// kustomisasi yang dinamis dan informatif kepada pengguna.

import MenuSession from '../../services/menu/MenuSession.js';
import { THEME_PRESETS, FONT_MAPS } from '../../services/menu/menuUtils.js';

const DEFAULT_PREFERENCES = {
    theme: 'default',
    photo: false,
    widgets: {
        header: true,
        cognitive: true,
        activity: true
    }
};

const VALID_WIDGETS = Object.keys(DEFAULT_PREFERENCES.widgets);

// [BARU] Fungsi terpusat untuk menampilkan bantuan pengaturan
async function sendSettingsHelp(m) {
    const validThemes = Object.keys(THEME_PRESETS).join(', ');
    const validFonts = Object.keys(FONT_MAPS).join(', ');

    let helpText = `*Pengaturan Kustomisasi Dasbor Menu*\n\n`;
    helpText += `Gunakan: \`.menu set <opsi> <nilai>\`\n\n`;
    helpText += `╭─「 *Opsi yang Tersedia* 」\n`;
    helpText += `│\n`;
    helpText += `│ ≫ *theme*\n`;
    helpText += `│    Mengubah keseluruhan tema visual.\n`;
    helpText += `│    Nilai: \`${validThemes}\`\n`;
    helpText += `│    Contoh: \`.menu set theme cyberpunk\`\n`;
    helpText += `│\n`;
    helpText += `│ ≫ *font*\n`;
    helpText += `│    Mengubah font teks pada menu.\n`;
    helpText += `│    Nilai: \`${validFonts}\`\n`;
    helpText += `│    Contoh: \`.menu set font monospace\`\n`;
    helpText += `│\n`;
    helpText += `│ ≫ *photo*\n`;
    helpText += `│    Menampilkan/menyembunyikan foto header.\n`;
    helpText += `│    Nilai: \`on\` atau \`off\`\n`;
    helpText += `│    Contoh: \`.menu set photo on\`\n`;
    helpText += `│\n`;
    helpText += `│ ≫ *widget*\n`;
    helpText += `│    Mengatur visibilitas widget.\n`;
    helpText += `│    Gunakan: \`.menu set widget <nama> <on|off>\`\n`;
    helpText += `│    Widget: \`${VALID_WIDGETS.join(', ')}\`\n`;
    helpText += `│    Contoh: \`.menu set widget cognitive off\`\n`;
    helpText += `│\n`;
    helpText += `│ ≫ *birthday*\n`;
    helpText += `│    Menyimpan tanggal lahir Anda (DD-MM).\n`;
    helpText += `│    Contoh: \`.menu set birthday 25-12\`\n`;
    helpText += `│\n`;
    helpText += `╰────\n\n`;
    helpText += `Ketik \`.menu settings\` untuk melihat preferensi Anda saat ini.`;

    return m.reply(helpText);
}

function ensureCompletePrefs(userProfile) {
    if (!userProfile.menuPrefs) {
        userProfile.menuPrefs = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
        return;
    }
    userProfile.menuPrefs.widgets = { ...DEFAULT_PREFERENCES.widgets, ...userProfile.menuPrefs.widgets };
    userProfile.menuPrefs = { ...DEFAULT_PREFERENCES, ...userProfile.menuPrefs };
}

export default {
    name: 'menu',
    aliases: ['help', 'dashboard'],
    category: 'Utility',
    description: 'Menampilkan dasbor sistem yang personal dan dapat dikustomisasi.',
    usage: 'menu [set|settings]',

    async execute(context) {
        const { bot, m, args } = context;
        const action = args[0]?.toLowerCase();

        if (action === 'set' || action === 'settings') {
            const userProfile = bot.stateManager.state.registeredUsers[m.sender];
            if (!userProfile) return m.reply("Fitur kustomisasi hanya untuk pengguna terdaftar. Ketik `.register`");

            ensureCompletePrefs(userProfile);
            const setting = args[1]?.toLowerCase();

            // Menampilkan bantuan jika tidak ada argumen atau diminta
            if (action === 'set' && (!setting || setting === 'help')) {
                return sendSettingsHelp(m);
            }

            // Menampilkan pengaturan saat ini
            if (action === 'settings') {
                let settingsText = `*Preferensi Menu Anda Saat Ini*\n\n`;
                settingsText += `*Tema:* ${userProfile.menuPrefs.theme}\n`;
                settingsText += `*Foto Header:* ${userProfile.menuPrefs.photo ? 'Aktif' : 'Nonaktif'}\n`;
                settingsText += `*Widget Aktif:*\n`;
                for (const widget in userProfile.menuPrefs.widgets) {
                    settingsText += `  - ${widget}: ${userProfile.menuPrefs.widgets[widget] ? '✅' : '❌'}\n`;
                }
                return m.reply(settingsText);
            }

            const value = args[2]?.toLowerCase();
            if (!value && setting !== 'widget') return m.reply(`Harap berikan nilai untuk pengaturan '${setting}'. Gunakan '.menu set help' untuk bantuan.`);

            switch(setting) {
                case 'theme':
                const validThemes = Object.keys(THEME_PRESETS);
                if (!validThemes.includes(value)) return m.reply(`Tema tidak valid. Tema tersedia: ${validThemes.join(', ')}`);
                userProfile.menuPrefs.theme = value;
                break;

                case 'font':
                const validFonts = Object.keys(FONT_MAPS);
                if (!validFonts.includes(value)) return m.reply(`Font tidak valid. Font tersedia: ${validFonts.join(', ')}`);
                userProfile.menuPrefs.font = value;
                break;

                case 'photo':
                if (!['on', 'off'].includes(value)) return m.reply(`Nilai tidak valid. Gunakan 'on' atau 'off'.`);
                userProfile.menuPrefs.photo = (value === 'on');
                break;

                case 'widget':
                const widgetName = value;
                const widgetState = args[3]?.toLowerCase();
                if (!VALID_WIDGETS.includes(widgetName)) return m.reply(`Widget tidak dikenal. Widget tersedia: ${VALID_WIDGETS.join(', ')}`);
                if (!['on', 'off'].includes(widgetState)) return m.reply(`Status tidak valid untuk widget '${widgetName}'. Gunakan 'on' atau 'off'.`);
                userProfile.menuPrefs.widgets[widgetName] = (widgetState === 'on');
                break;

                case 'birthday':
                if (!/^\d{1,2}-\d{1,2}$/.test(value)) return m.reply('Format tanggal lahir salah. Gunakan format DD-MM (contoh: 25-12).');
                userProfile.birthday = value;
                break;

                default:
                return m.reply(`Pengaturan '${setting}' tidak dikenal. Ketik '.menu set help' untuk daftar lengkap.`);
            }

            await bot.stateManager.save('registeredUsers');
            return m.reply(`✅ Pengaturan *${setting}* berhasil diperbarui!`);
        }

        // --- Logika Dasbor Interaktif ---
        const oldSession = bot.stateManager.state.activeSessions.get(m.sender);
        if (oldSession && typeof oldSession.stop === 'function') {
            await oldSession.stop();
        }

        const session = new MenuSession(context);
        await session.start();
    },

    async onReply(context) {
        const { m, session } = context;
        // [PERBAIKAN] Pastikan session adalah instance yang benar sebelum memanggil metodenya
        if (session instanceof MenuSession) {
            await session.handleReply(m.text);
        }
    }
};
