// services/BackupManager.js

import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

// Impor fungsi formatter dari main.js (jika diperlukan) atau definisikan ulang di sini
// Untuk kesederhanaan, kita akan definisikan ulang logika pembersihan di sini.

const ignoreList = ['node_modules', '.git', 'session', 'prometheus-backup-', '.npm'];

function cleanCode(content) {
    // Menghapus komentar single-line dan multi-line
    let cleaned = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    // Menghapus baris kosong berlebih
    cleaned = cleaned.replace(/^\s*[\r\n]/gm, '');
    return cleaned;
}

function addFilesToZip(zip, directory, options) {
    const items = fs.readdirSync(directory);
    for (const item of items) {
        if (ignoreList.some(ignoredItem => item.startsWith(ignoredItem))) continue;

        const fullPath = path.join(directory, item);
        const relativePath = path.relative(process.cwd(), fullPath);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            addFilesToZip(zip, fullPath, options);
        } else {
            let content = fs.readFileSync(fullPath, 'utf-8');
            if (options.cleanCode && path.extname(fullPath) === '.js') {
                content = cleanCode(content);
            }
            zip.addFile(relativePath, Buffer.from(content, 'utf-8'));
        }
    }
}

export async function createBackup(options = { includeSession: false, cleanCode: false }) {
    const zip = new AdmZip();
    const backupFileName = `prometheus-backup-${new Date().toISOString().replace(/:/g, '-')}.zip`;
    const outputPath = path.join(process.cwd(), backupFileName);

    // Tambahkan semua file dari direktori root
    addFilesToZip(zip, process.cwd(), options);

    // Tambahkan creds.json secara spesifik jika diminta
    if (options.includeSession) {
        const credsPath = path.join(process.cwd(), 'session', 'creds.json');
        if (fs.existsSync(credsPath)) {
            zip.addFile('session/creds.json', fs.readFileSync(credsPath));
        }
    }

    zip.writeZip(outputPath);
    return outputPath;
}
