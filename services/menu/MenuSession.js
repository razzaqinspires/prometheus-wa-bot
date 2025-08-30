// services/menu/MenuSession.js (V3.0 - Stateful & Resilient)
import { helpers, widgets, THEME_PRESETS } from './menuUtils.js';

export default class MenuSession {
    constructor(context) {
        this.context = context;
        this.bot = context.bot;
        this.m = context.m;
        this.sender = context.m.sender;
        this.command = 'menu';
        this.isStopped = false;
        this.currentPage = 1;
        this.paginatedCommands = this._paginateCommands();
        this.totalPages = this.paginatedCommands.length;
        this.messageKey = null;
        this.intervalId = null;
        this.timeoutId = null;
        this.lastText = '';
        this.expiresAt = Date.now() + 2 * 60 * 1000;
    }

    _paginateCommands() {
        const commandsPerPage = this.bot.config.commandsPerPage || 10;
        const allCommands = Array.from(this.bot.commandManager.commands.values())
        .filter(cmd => cmd.category && cmd.category.toLowerCase() !== 'owner');
        const pages = [];
        for (let i = 0; i < allCommands.length; i += commandsPerPage) {
            pages.push(allCommands.slice(i, i + commandsPerPage));
        }
        return pages;
    }

    async _prepareMenuText(isFinal = false) {
        const userPrefs = this.bot.stateManager.state.registeredUsers[this.sender]?.menuPrefs || {};
        const theme = THEME_PRESETS[userPrefs.theme] || THEME_PRESETS.default;

        let text = '';

        if (userPrefs.widgets?.header) text += widgets.buildHeader(this.context, theme);
        if (userPrefs.widgets?.cognitive) text += widgets.buildCognitive(this.context, theme);
        if (userPrefs.widgets?.activity) text += widgets.buildActivity(this.context);

        const commandsOnPage = this.paginatedCommands[this.currentPage - 1] || [];
        text += widgets.buildCommands(this.context, commandsOnPage, theme);
        text += widgets.buildFooter(this.context, this, theme);

        if (isFinal) {
            text += `\n\n_Sesi telemetri dasbor telah dihentikan._`;
        }

        return helpers.applyFont(text, theme.font);
    }

    async start() {
        const photoBuffer = await widgets.buildPhoto(this.context);
        const initialText = await this._prepareMenuText();
        this.lastText = initialText;
        const messagePayload = photoBuffer ? { image: photoBuffer, caption: initialText } : { text: initialText };
        const sentMsg = await this.bot.sock.sendMessage(this.m.from, messagePayload, { quoted: this.m.raw });
        this.messageKey = sentMsg.key;
        const userPrefs = this.bot.stateManager.state.registeredUsers[this.sender]?.menuPrefs || {};
        if (userPrefs.style === 'full') {
            this.intervalId = setInterval(() => this.update(), 3000);
        }
        this.timeoutId = setTimeout(() => this.stop(), 2 * 60 * 1000);
        this.bot.stateManager.state.activeSessions.set(this.sender, this);
    }

    async update() {
        if (this.isStopped) return;
        const newText = await this._prepareMenuText();
        if (this.lastText === newText) return;
        this.lastText = newText;
        try {
            await this.bot.sock.relayMessage(this.m.from, {
                protocolMessage: { key: this.messageKey, type: 14, editedMessage: { conversation: newText } }
            }, {});
        } catch (e) { this.stop(); }
    }

    async stop() {
        if (this.isStopped) return;
        this.isStopped = true;
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
        this.bot.stateManager.state.activeSessions.delete(this.sender);
        const finalText = await this._prepareMenuText(true);
        try {
            await this.bot.sock.relayMessage(this.m.from, {
                protocolMessage: { key: this.messageKey, type: 14, editedMessage: { conversation: finalText } }
            }, {});
        } catch (e) {}
    }

    async handleReply(replyText) {
        if (this.isStopped) return;
        const text = replyText.toLowerCase().trim();
        if (text === 'stop') return this.stop();

        let newPage = this.currentPage;
        if (text === 'next' || text === 'n') newPage++;
        else if (text === 'prev' || text === 'p') newPage--;
        else if (!isNaN(parseInt(text))) newPage = parseInt(text);
        else return;

        if (newPage > 0 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => this.stop(), 2 * 60 * 1000);
            await this.update();
        }
    }
}
