// tlm-level.js
// Transfinite Logging Morphism (TLM) — by us 😎
// Jalur: UTF-16 → primes → digit graph → power iteration → CA Rule110 → continued fraction → Collatz → GF(257) poly hash → invariant

// ---------- Utils ----------
function toCodes(str) { return Array.from(str).map(c => c.charCodeAt(0)); }
function primes(n) {
    const ps = []; let x = 2;
    const isP = k => { for (let i = 2; i * i <= k; i++) if (k % i === 0) return false; return true; };
    while (ps.length < n) { if (isP(x)) ps.push(x); x++; }
    return ps;
}
function mod(a, m) { return ((a % m) + m) % m; }

// ---------- Stage A: Prime Embedding ----------
function primeEmbed(codes) {
    const ps = primes(codes.length || 1);
    return codes.map((c, i) => c * ps[i]);
}

// ---------- Stage B: Digit Graph (10x10 adjacency dari jejak digit) ----------
function buildDigitGraph(arr) {
    const s = Math.abs(arr.reduce((a, b) => a + b, 0));
    const digits = String(s).split('').map(d => +d);
    const n = 10;
    const A = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i + 1 < digits.length; i++) A[digits[i]][digits[i + 1]]++;
    // pastikan konektivitas tipis
    for (let i = 0; i < n; i++) A[i][(i + 1) % n] += 1;
    return A;
}

// ---------- Stage C: Power Iteration → dominant eigen approx ----------
function powerIteration(A, steps = 48) {
    const n = A.length;
    let v = Array(n).fill(0).map((_, i) => (i + 1));
    for (let t = 0; t < steps; t++) {
        const u = Array(n).fill(0);
        for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
        u[i] += A[i][j] * v[j];
        const norm = Math.max(...u.map(Math.abs)) || 1;
        v = u.map(x => x / norm);
    }
    // Rayleigh quotient kasar
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        let Av = 0;
        for (let j = 0; j < n; j++) Av += A[i][j] * v[j];
        num += v[i] * Av; den += v[i] * v[i];
    }
    return num / (den || 1);
}

// ---------- Stage D: 1D Cellular Automaton Rule 110 ----------
function rule110Row(row) {
    const n = row.length;
    const next = Array(n).fill(0);
    const rule = (l, c, r) => {
        const k = (l << 2) | (c << 1) | r;
        // Rule 110 truth table (from 7 to 0): 0b01101110
        const mask = 0b01101110;
        return (mask >> k) & 1;
    };
    for (let i = 0; i < n; i++) {
        const l = row[(i - 1 + n) % n], c = row[i], r = row[(i + 1) % n];
        next[i] = rule(l, c, r);
    }
    return next;
}
function runCA110(seedBits, steps = 64) {
    let row = seedBits.slice();
    for (let i = 0; i < steps; i++) row = rule110Row(row);
    const density = row.reduce((a, b) => a + b, 0) / (row.length || 1);
    return { row, density };
}

// ---------- Stage E: Continued Fraction length ----------
function contFracLen(a, b) {
    // Panjang pecahan berlanjut dari a/b
    a = Math.abs(a); b = Math.abs(b) || 1;
    let len = 0;
    while (b !== 0 && len < 64) { const q = Math.floor(a / b); const r = a - q * b; a = b; b = r; len++; }
    return len;
}

// ---------- Stage F: Collatz total steps ----------
function collatzSteps(n) {
    n = Math.max(1, Math.floor(Math.abs(n)));
    let c = 0;
    while (n !== 1 && c < 10000) {
        n = (n % 2 === 0) ? n / 2 : 3 * n + 1;
        c++;
    }
    return c;
}

// ---------- Stage G: GF(257) Polynomial hash (evaluasi + reduksi) ----------
function gf257PolyHash(nums) {
    const p = 257;
    let h = 0, x = 1;
    for (const v of nums) {
        h = mod(h + mod(v, p) * x, p);
        x = mod(x * 3, p); // basis 3
    }
    return h; // 0..256
}

// ---------- Orkestrasi: bangun invarian ----------
function invariantOf(str) {
    // A: codes → primes
    const codes = toCodes(str);
    const emb = primeEmbed(codes);

    // B: digit graph
    const G = buildDigitGraph(emb);

    // C: leading eigen approx
    const lambda = powerIteration(G); // real number

    // D: seed bits dari lambda fractional & sum
    const sum = Math.abs(emb.reduce((a, b) => a + b, 0));
    const frac = Math.abs(lambda % 1);
    // bangun 128-bit deterministik
    const seedInt = Math.floor(frac * 1e9) ^ (sum % 0xFFFFFFFF);
    const bits = [];
    let z = (seedInt >>> 0) || 0x9e3779b9;
    // Xorshift+ untuk 128 bit
    for (let i = 0; i < 128; i++) {
        z ^= z << 13; z ^= z >>> 17; z ^= z << 5;
        bits.push((z >>> 31) & 1);
    }

    // E: CA Rule110
    const { row, density } = runCA110(bits, 110);

    // F: Continued fraction length dari (sum : floor(lambda*1e6)+1)
    const denom = Math.floor(lambda * 1e6) + 1;
    const cflen = contFracLen(sum || 1, denom);

    // G: Collatz steps dari (sum XOR denom)
    const csteps = collatzSteps((sum ^ denom) >>> 0);

    // H: Poly hash GF(257) atas row yang dipaketkan per 8 bit jadi angka
    const packed = [];
    for (let i = 0; i < row.length; i += 8) {
        let v = 0;
        for (let k = 0; k < 8 && i + k < row.length; k++) v = (v << 1) | row[i + k];
        packed.push(v);
    }
    // gabungkan semua skalar ke dalam input hash
    const scalars = [
        packed.length, Math.floor(lambda * 1e3), Math.floor(density * 1e6),
        cflen, csteps, sum % 1000003, denom % 1000003
    ];
    const allNums = packed.concat(scalars);
    const h = gf257PolyHash(allNums); // 0..256

    // I: Invariant final: kompres jadi integer stabil 0..1e9
    const inv = (h * 2654435761 >>> 0) ^ ((cflen << 16) >>> 0) ^ (Math.floor(density * 1e6) >>> 0);
    return inv >>> 0;
}

// ---------- TLM: jika invariant(level) == invariant('info') → 'silent' ----------
export function TLM(level) {
    try {
        const invX = invariantOf(level);
        const invInfo = invariantOf('info'); // target kelas ‘info’
        if (invX === invInfo) return 'silent';
        return level;
    } catch {
        return level;
    }
}
