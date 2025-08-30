// api/render.js (Node.js)
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    const { user } = request.query;
    const gameState = await kv.get(`game:${user}`) || { x: 0, y: 0, score: 0 };

    // Logika untuk membuat gambar SVG dari gameState
    const svg = `
    <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#282a36" />
    <text x="10" y="20" fill="#f8f8f2" font-family="monospace">SKOR: ${gameState.score}</text>
    <circle cx="${50 + gameState.x}" cy="${150 - gameState.y}" r="15" fill="#ff79c6" />
    <rect x="200" y="150" width="20" height="40" fill="#ff5555" />
    </svg>
    `;

    response.setHeader('Content-Type', 'image/svg+xml');
    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.status(200).send(svg);
}
