// api/action.js (V2.0 - Physics & Vitals Engine)
// Peningkatan: Menambahkan fisika dasar, deteksi tabrakan,
// dan interaksi dinamis dengan kondisi live dari entitas bot.

import { kv } from '@vercel/kv';

// === Konstanta Permainan ===
const JUMP_VELOCITY = 100;
const GRAVITY = -15;
const GROUND_LEVEL = 0;
const MAX_JUMP_HEIGHT = 150;
const OBSTACLE_SPEED = 20;

// === Fungsi Helper ===

/**
* Mengambil vitalitas bot dari database terpisah.
* Ini adalah fungsi placeholder, Anda perlu mengimplementasikan
* bagaimana bot Anda mengirim data ke database ini.
* @returns {Promise<object>}
*/
async function getBotVitals() {
    try {
        const vitals = await kv.get('bot:vitals');
        // Fallback jika tidak ada data
        return vitals || { energy: 100, fatigue: 0, sfp: 0 };
    } catch (e) {
        return { energy: 100, fatigue: 0, sfp: 0 };
    }
}


/**
* Mengupdate state permainan berdasarkan fisika dan aksi.
* @param {object} gameState - State permainan saat ini.
* @param {object} botVitals - Vitalitas bot saat ini.
* @param {string} move - Aksi yang diambil pengguna ('jump', 'duck', dll.).
* @returns {object} State permainan yang baru.
*/
function updateGameState(gameState, botVitals, move) {
    let newState = { ...gameState };

    // --- Terapkan Fisika ---
    // Tambahkan kecepatan vertikal saat ini ke posisi Y
    newState.y += newState.velocityY;
    // Terapkan gravitasi ke kecepatan vertikal
    newState.velocityY += GRAVITY;

    // Cek jika pemain menyentuh tanah
    if (newState.y <= GROUND_LEVEL) {
        newState.y = GROUND_LEVEL;
        newState.velocityY = 0;
        newState.isJumping = false;
    }

    // --- Terapkan Aksi Pengguna ---
    if (move === 'jump' && !newState.isJumping) {
        // Kekuatan lompatan dipengaruhi oleh energi bot!
        const jumpPower = JUMP_VELOCITY * (botVitals.energy / 100);
        newState.velocityY = jumpPower;
        newState.isJumping = true;
    }

    // --- Gerakkan Rintangan & Deteksi Tabrakan ---
    for (let obstacle of newState.obstacles) {
        // Gerakkan rintangan ke kiri
        obstacle.x -= OBSTACLE_SPEED;

        // Deteksi tabrakan (sangat disederhanakan)
        const playerRight = 50 + 15; // Posisi pemain + radius
        const playerLeft = 50 - 15;
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleTop = obstacle.y + obstacle.height;

        if (playerRight > obstacleLeft && playerLeft < obstacleRight && newState.y < obstacleTop) {
            newState.isGameOver = true;
            newState.finalScore = newState.score;
        }
    }

    // Hapus rintangan yang sudah lewat layar
    newState.obstacles = newState.obstacles.filter(obs => obs.x > -obs.width);

    // Tambahkan rintangan baru secara acak
    if (Math.random() < 0.05 && newState.obstacles.length < 3) {
        newState.obstacles.push({ x: 600, y: 0, width: 20, height: 40 });
    }

    // Update skor jika belum game over
    if (!newState.isGameOver) {
        newState.score += 1;
    }

    return newState;
}


// --- Handler Utama Serverless ---
export default async function handler(request, response) {
    const { user, move } = request.query;

    if (!user) {
        return response.status(400).send('User identifier is required.');
    }

    // 1. Baca state game dan vitalitas bot secara paralel
    const [gameState, botVitals] = await Promise.all([
        kv.get(`game:${user}`) || { x: 0, y: 0, velocityY: 0, isJumping: false, score: 0, obstacles: [], isGameOver: false },
        getBotVitals()
    ]);

    // Jika game sudah berakhir dan ada aksi, reset game
    if (gameState.isGameOver && move) {
        const newGame = { x: 0, y: 0, velocityY: 0, isJumping: false, score: 0, obstacles: [], isGameOver: false };
        await kv.set(`game:${user}`, newGame);
        return response.redirect(302, `https://github.com/razzaqinspires/prometheus-wa-bot`);
    }

    // 2. Hitung state game berikutnya
    const newGameState = updateGameState(gameState, botVitals, move);

    // 3. Simpan state game yang baru
    await kv.set(`game:${user}`, newGameState);

    // 4. Arahkan kembali ke README
    // Menambahkan timestamp untuk mencegah GitHub menyimpan cache gambar
    response.redirect(302, `https://github.com/razzaqinspires/prometheus-wa-bot?cache_buster=${Date.now()}`);
}
