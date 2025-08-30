// commands/utility/buatdokumen.js

import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import { extractSignature, cropPhotoToCircle, generateLamaranPDF, generateCvDocx } from '../../services/DocumentGenerator.js';

const TMP_DIR = './tmp';

// Template data untuk diisi pengguna
const DATA_TEMPLATE = `📝 *Silakan Isi Data Anda* 📝
Salin pesan ini, isi, lalu kirim kembali.

Nama Lengkap:
Alamat Lengkap:
Nomor Telepon/WA:
Alamat Email:
Ringkasan Diri (1 paragraf):
---
Pengalaman Kerja (posisi, perusahaan, tahun):
- Posisi 1, PT. ABC, 2020-2022
- Posisi 2, CV. XYZ, 2018-2020
---
Pendidikan Terakhir (institusi, tahun lulus):
- Universitas DEF, 2018
- SMA GHI, 2014
---
Keterampilan (pisahkan dengan koma):
- Keterampilan 1, Keterampilan 2, Keterampilan 3`;

export default {
    name: 'buatdokumen',
    aliases: ['lamaran', 'cv'],
    category: 'Utility',
    description: 'Asisten untuk membuat dokumen lamaran kerja, CV, dan riwayat hidup.',

    async execute(context) {
        const { sock, m, activeSessions } = context;
        if (activeSessions.has(m.sender)) {
            return m.reply('Anda sedang dalam sesi aktif lain. Harap selesaikan terlebih dahulu.');
        }

        const question = `*Asisten Karir Prometheus Aktif* 📄\n\nDokumen apa yang ingin Anda buat?\n\n1. Surat Lamaran Kerja\n2. Curriculum Vitae (CV)\n3. Riwayat Hidup (Ringkas)\n\nBalas pesan ini dengan nomor pilihan Anda (contoh: *1* atau *1, 2*).`;
        const sentMsg = await m.reply(question);

        activeSessions.set(m.sender, {
            command: 'buatdokumen',
            step: 'awaiting_doc_choice',
            messageId: sentMsg.key.id,
            choices: {},
            data: {},
            timeout: setTimeout(() => {
                if (activeSessions.has(m.sender)) {
                    activeSessions.delete(m.sender);
                    sock.sendMessage(m.from, { text: '[SISTEM] Sesi pembuatan dokumen berakhir karena waktu habis.' });
                }
            }, 5 * 60 * 1000) // Timeout 5 menit
        });
    },

    async onReply(context) {
        const { sock, m, session, activeSessions } = context;
        const text = m.text.trim();

        try {
            switch (session.step) {
                case 'awaiting_doc_choice':
                const choices = text.split(',').map(n => parseInt(n.trim()));
                session.choices.lamaran = choices.includes(1);
                session.choices.cv = choices.includes(2);
                session.choices.riwayatHidup = choices.includes(3);

                if (!session.choices.lamaran && !session.choices.cv && !session.choices.riwayatHidup) {
                    return m.reply("Pilihan tidak valid. Harap balas dengan nomor, contoh: 1, 2");
                }

                session.step = 'awaiting_data';
                const dataMsg = await sock.sendMessage(m.from, { text: DATA_TEMPLATE });
                session.messageId = dataMsg.key.id;
                break;

                case 'awaiting_data':
                // Parsing data yang dikirim pengguna
                const lines = text.split('\n');
                session.data.nama = lines.find(l => l.startsWith('Nama Lengkap:')).split(':')[1].trim();
                // ... Lakukan parsing untuk semua data di sini ...

                if (session.choices.cv) {
                    session.step = 'awaiting_photo';
                    const photoMsg = await sock.sendMessage(m.from, { text: "📷 Data diterima. Sekarang, silakan kirim foto formal Anda untuk CV." });
                    session.messageId = photoMsg.key.id;
                } else if (session.choices.lamaran) {
                    session.step = 'awaiting_signature';
                    const sigCanvas = await fs.readFile(path.join(__dirname, '..', '..', 'assets', 'signature_canvas.png')); // Asumsi ada gambar polosan
                    const sigMsg = await sock.sendMessage(m.from, { image: sigCanvas, caption: "✒️ Selanjutnya, tanda tangan. Gunakan fitur edit WhatsApp untuk menggambar tanda tangan Anda di gambar ini, lalu kirim kembali dengan caption *'final'*"});
                    session.messageId = sigMsg.key.id;
                } else {
                    // Langsung ke finalisasi jika tidak butuh foto/tanda tangan
                    await finalize(context);
                }
                break;

                case 'awaiting_photo':
                if (!/image/.test(m.mimetype)) return m.reply("Harap kirim sebuah gambar.");
                await m.react('🔄');
                const photoBuffer = await m.download();
                const circledPhotoBuffer = await cropPhotoToCircle(photoBuffer);
                session.data.photoPath = path.join(TMP_DIR, `${m.sender}_photo.png`);
                await fs.writeFile(session.data.photoPath, circledPhotoBuffer);

                if (session.choices.lamaran) {
                    session.step = 'awaiting_signature';
                    const sigCanvas = await fs.readFile(path.join(__dirname, '..', '..', 'assets', 'signature_canvas.png'));
                    const sigMsg = await sock.sendMessage(m.from, { image: sigCanvas, caption: "✒️ Foto berhasil diproses. Terakhir, tanda tangan. Gambar di kanvas ini dan kirim kembali dengan caption *'final'*"});
                    session.messageId = sigMsg.key.id;
                } else {
                    await finalize(context);
                }
                break;

                case 'awaiting_signature':
                if (!/image/.test(m.mimetype) || text.toLowerCase() !== 'final') {
                    return m.reply("Harap kirim kembali gambar tanda tangan dengan caption 'final'.");
                }
                await m.react('🔄');
                const sigBuffer = await m.download();
                const extractedSigBuffer = await extractSignature(sigBuffer);
                session.data.signaturePath = path.join(TMP_DIR, `${m.sender}_sig.png`);
                await fs.writeFile(session.data.signaturePath, extractedSigBuffer);

                await finalize(context);
                break;
            }
        } catch (error) {
            m.reply(`[ANOMALI] Terjadi kesalahan pada sesi: ${error.message}. Sesi dihentikan.`);
            activeSessions.delete(m.sender);
        }
    }
};

async function finalize(context) {
    const { sock, m, session, activeSessions } = context;
    await m.reply("✅ Semua data lengkap. Memulai proses pembuatan dokumen. Harap tunggu...");

    const filesToCreate = [];
    if (session.choices.lamaran) {
        const sigBuffer = await fs.readFile(session.data.signaturePath);
        const pdfBytes = await generateLamaranPDF(session.data, sigBuffer);
        filesToCreate.push({ name: `Surat Lamaran - ${session.data.nama}.pdf`, buffer: Buffer.from(pdfBytes) });
    }
    if (session.choices.cv) {
        const photoBuffer = await fs.readFile(session.data.photoPath);
        const docxBytes = await generateCvDocx(session.data, photoBuffer);
        filesToCreate.push({ name: `CV - ${session.data.nama}.docx`, buffer: Buffer.from(docxBytes) });
    }

    if (filesToCreate.length > 1) {
        const zip = new AdmZip();
        for (const file of filesToCreate) {
            zip.addFile(file.name, file.buffer);
        }
        await sock.sendMessage(m.from, {
            document: zip.toBuffer(),
            mimetype: 'application/zip',
            fileName: `Dokumen Lamaran - ${session.data.nama}.zip`
        });
    } else if (filesToCreate.length === 1) {
        const file = filesToCreate[0];
        const mimetype = file.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        await sock.sendMessage(m.from, { document: file.buffer, mimetype, fileName: file.name });
    }

    // Cleanup
    if(session.data.photoPath) await fs.unlink(session.data.photoPath);
    if(session.data.signaturePath) await fs.unlink(session.data.signaturePath);
    activeSessions.delete(m.sender);
}
