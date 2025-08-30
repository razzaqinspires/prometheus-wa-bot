// web/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startWebServer(botState, aiState, logger) {
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });
    const PORT = process.env.PORT || 3000;

    app.use(express.static(path.join(__dirname, 'public')));

    wss.on('connection', (ws) => {
        logger.info('[WEB-SOCKET] Klien dasbor baru terhubung.');
        ws.on('close', () => {
            logger.info('[WEB-SOCKET] Klien dasbor terputus.');
        });
    });

    setInterval(() => {
        const liveData = {
            fisiologi: {
                detakJantung: aiState.currentHeartRate,
                energi: parseFloat(aiState.energy.toFixed(2)),
                kelelahan: parseFloat(aiState.fatigue.toFixed(2)),
                mood: aiState.mood
            },
            sistem: {
                uptime: new Date() - botState.startTime,
                totalPerintah: Object.values(botState.systemStats.commandHits).reduce((a, b) => a + b, 0)
            }
        };
        const payload = JSON.stringify(liveData);
        wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(payload);
            }
        });
    }, 1000);

    server.listen(PORT, () => {
        logger.info(`[WEB] Server web Prometheus aktif di http://localhost:${PORT}`);
    });
}