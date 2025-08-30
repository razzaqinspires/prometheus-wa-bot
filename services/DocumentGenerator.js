// services/DocumentGenerator.js
import fs from 'fs/promises';
import path from 'path';
import * as Jimp from 'jimp';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } from 'docx';

export async function extractSignature(inputBuffer) {
    const image = await Jimp.read(inputBuffer);
    image.greyscale();
    image.contrast(1);
    image.autocrop();
    return await image.getBufferAsync(Jimp.MIME_PNG);
}

export async function cropPhotoToCircle(inputBuffer) {
    const image = await Jimp.read(inputBuffer);
    const size = Math.min(image.getWidth(), image.getHeight());
    image.cover(size, size);
    image.circle();
    return await image.getBufferAsync(Jimp.MIME_PNG);
}

export async function generateLamaranPDF(data, signatureBuffer) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const { width, height } = page.getSize();
    let y = height - 72;

    const drawText = (text, size, indent = 72) => {
        page.drawText(text, { x: indent, y, size, font });
        y -= size * 1.5;
    };

    drawText(`${data.nama}`, 12);
    drawText(`${data.alamat}`, 12);
    drawText(`Telp/WA: ${data.telepon}`, 12);
    drawText(`Email: ${data.email}`, 12);
    y -= 24;
    drawText('Dengan hormat,', 12);
    y -= 12;
    drawText('Saya yang bertanda tangan di bawah ini:', 12, 90);
    y -= 100;
    drawText('Hormat saya,', 12);

    if (signatureBuffer) {
        const signatureImage = await pdfDoc.embedPng(signatureBuffer);
        const sigDims = signatureImage.scale(0.25);
        page.drawImage(signatureImage, { x: 72, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
        y -= sigDims.height;
    }

    y -= 24;
    drawText(data.nama, 12);

    return await pdfDoc.save();
}

export async function generateCvDocx(data, photoBuffer) {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: photoBuffer,
                            transformation: { width: 100, height: 100 },
                            floating: { horizontalPosition: { align: 'right' }, verticalPosition: { align: 'top' } }
                        }),
                        new TextRun({ text: data.nama, bold: true, size: 48 }),
                    ],
                }),
                new Paragraph({ text: `${data.alamat} | ${data.telepon} | ${data.email}`, style: "compact" }),
                new Paragraph({ text: "Ringkasan", heading: HeadingLevel.HEADING_1, spacing: { before: 200 } }),
                new Paragraph({ text: data.ringkasan }),
                new Paragraph({ text: "Pengalaman Kerja", heading: HeadingLevel.HEADING_1, spacing: { before: 200 } }),
                ...data.pengalaman.map(p => new Paragraph({ text: `${p.posisi} di ${p.perusahaan} (${p.tahun})`, bullet: { level: 0 } })),
                new Paragraph({ text: "Pendidikan", heading: HeadingLevel.HEADING_1, spacing: { before: 200 } }),
                ...data.pendidikan.map(p => new Paragraph({ text: `${p.institusi} (${p.tahun})`, bullet: { level: 0 } })),
                new Paragraph({ text: "Keterampilan", heading: HeadingLevel.HEADING_1, spacing: { before: 200 } }),
                new Paragraph({ text: data.keterampilan.join(', ') }),
            ],
        }],
    });
    return await Packer.toBuffer(doc);
}
