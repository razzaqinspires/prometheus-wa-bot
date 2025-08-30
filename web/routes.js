// web/routes.js

import express from 'express';

export default function setupRoutes(botState, aiState) {
    const router = express.Router();

    router.get('/status', (req, res) => {
        // Gabungkan data yang relevan untuk dikirim sebagai JSON
        const liveData = {
            fisiologi: {
                detakJantung: aiState.currentHeartRate,
                energi: parseFloat(aiState.energy.toFixed(2)),
                kelelahan: parseFloat(aiState.fatigue.toFixed(2)),
                mood: aiState.mood
            },
            sistem: {
                uptime: new Date() - botState.startTime,
                mode: botState.settings.botMode,
                totalPerintah: Object.values(botState.systemStats.commandHits).reduce((a, b) => a + b, 0)
            }
        };
        
        // Atur header untuk mengizinkan Cross-Origin Resource Sharing (CORS)
        res.header('Access-Control-Allow-Origin', '*');
        res.json(liveData);
    });

    return router;
}