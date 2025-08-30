// services/codeScanner.js (V6.1 - Lingkup Terbatas & Stabil)

import fs from 'fs/promises';
import path from 'path';

/**
* Merapikan kode JavaScript dengan inden 4 spasi.
* @param {string} code - Kode sumber yang akan dirapikan.
* @returns {string} Kode yang sudah dirapikan.
*/
function formatCode(code) {
    const lines = code.split(/\r?\n/);
    let formattedCode = '';
    let indentLevel = 0;
    const indentSize = '    ';

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('}') || trimmedLine.startsWith(')') || trimmedLine.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        if (trimmedLine) {
            formattedCode += indentSize.repeat(indentLevel) + trimmedLine + '\n';
        } else {
            formattedCode += '\n';
        }
        if (trimmedLine.endsWith('{') || trimmedLine.endsWith('(') || trimmedLine.endsWith('[')) {
            indentLevel++;
        }
    }
    return formattedCode.trim() + '\n';
}

/**
* Memindai, memvalidasi, dan merapikan seluruh basis kode saat startup.
* @param {import('pino').Logger} logger - Instansi logger untuk mencatat output.
*/
export async function initializeCodebaseScanner(logger) {
    console.log('\n\x1b[1;34m[SISTEM] Memulai Pemindaian & Standardisasi Basis Kode...\x1b[0m');
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let spinnerIndex = 0;
    const filesToScan = [];

    // [PERBAIKAN UTAMA] Gunakan process.cwd() untuk memastikan pemindaian hanya terjadi di direktori proyek saat ini.
    const ROOT_DIR = process.cwd();

    const ignore = ['.git', 'node_modules', 'session', 'data', '.npm', 'web', 'package.json', 'package-lock.json'];

    async function findFiles(dir) {
        try {
            const items = await fs.readdir(dir);
            for (const item of items) {
                if (ignore.includes(item)) continue;
                const fullPath = path.join(dir, item);
                try {
                    const stat = await fs.stat(fullPath);
                    if (stat.isDirectory()) {
                        await findFiles(fullPath);
                    } else if (item.endsWith('.js')) {
                        filesToScan.push(fullPath);
                    }
                } catch (statError) {
                    // Abaikan error stat (misalnya, broken symlink) dan lanjutkan
                    logger.warn(`[SCANNER] Gagal mengakses: ${fullPath}. Dilewati.`);
                }
            }
        } catch (readError) {
            logger.error({ err: readError }, `[SCANNER] Gagal memindai direktori: ${dir}. Periksa izin.`);
        }
    }

    await findFiles(ROOT_DIR);

    let scanned = 0;
    let formattedCount = 0;
    const totalFiles = filesToScan.length;

    if (totalFiles === 0) {
        logger.warn('[SCANNER] Tidak ada file .js yang ditemukan untuk dipindai di dalam proyek.');
        return;
    }

    const interval = setInterval(() => {
        const percent = totalFiles > 0 ? Math.floor((scanned / totalFiles) * 100) : 100;
        const currentFile = filesToScan[scanned] ? path.relative(ROOT_DIR, filesToScan[scanned]) : 'Selesai';
        process.stdout.write(`\r\x1b[36m ${spinner[spinnerIndex++ % spinner.length]} Memindai: ${currentFile}... [${percent}%]\x1b[0m`);
    }, 100);

    for (const file of filesToScan) {
        try {
            const originalContent = await fs.readFile(file, 'utf-8');
            if (originalContent) { // Hanya proses file yang tidak kosong
            const formattedContent = formatCode(originalContent);
            if (originalContent !== formattedContent) {
                await fs.writeFile(file, formattedContent, 'utf-8');
                formattedCount++;
            }
        }
    } catch (error) {
        logger.error({ err: error }, `Gagal memproses file: ${file}`);
    }
    scanned++;
}

clearInterval(interval);
process.stdout.write('\r' + ' '.repeat(process.stdout.columns) + '\r');

// Tampilan Tabel Elegan
console.log('┌──────────────────────────────────────────────┐');
console.log('│   \x1b[1;32mLaporan Standardisasi Kode Prometheus\x1b[0m      │');
console.log('├──────────────────────────────┬───────────────┤');
console.log(`│ Total File Dipindai          │ ${totalFiles.toString().padEnd(14)}│`);
console.log(`│ File yang Dirapikan          │ ${formattedCount.toString().padEnd(14)}│`);
console.log(`│ Status                       │ \x1b[32mSelesai\x1b[0m         │`);
console.log('└──────────────────────────────┴───────────────┘\n');
}
