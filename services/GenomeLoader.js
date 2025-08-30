// services/GenomeLoader.js (NEW - The Soul Transcriber)
// Modul ini membaca dan mem-parsing file .cml, menerjemahkan
// genom kepribadian menjadi struktur data yang dapat dieksekusi.

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import Logger from './Logger.js';

const logger = Logger.getLogger().child({ component: 'GenomeLoader' });
const GENOME_PATH = path.join(process.cwd(), 'persona.cml');

class GenomeLoader {
    constructor() {
        this.genome = null;
    }

    /**
    * Memuat, mem-parsing, dan memvalidasi genom dari file .cml.
    * @returns {object|null} Objek genom yang telah divalidasi.
    */
    load() {
        logger.info('Membaca sekuens Genom Sibernetik dari persona.cml...');
        try {
            if (!fs.existsSync(GENOME_PATH)) {
                logger.error('File persona.cml tidak ditemukan! Bot akan beroperasi dengan kepribadian default.');
                return null;
            }

            const fileContent = fs.readFileSync(GENOME_PATH, 'utf8');
            const parsedGenome = YAML.parse(fileContent);

            if (!this._validate(parsedGenome)) {
                logger.error('Validasi genom gagal. Periksa struktur file persona.cml.');
                return null;
            }

            this.genome = parsedGenome;
            logger.info(`Genom untuk persona '${this.genome.persona}' berhasil dimuat dan divalidasi.`);
            return this.genome;

        } catch (error) {
            logger.fatal({ err: error }, 'Terjadi error fatal saat memuat genom.');
            return null;
        }
    }

    /**
    * Memvalidasi struktur dasar dari objek genom.
    * @param {object} genome - Objek yang akan divalidasi.
    * @returns {boolean} - True jika valid.
    */
    _validate(genome) {
        return (
            genome &&
            typeof genome.persona === 'string' &&
            Array.isArray(genome.ethos) &&
            Array.isArray(genome.reflex_arc) &&
            typeof genome.cognitive_tuning === 'object' &&
            typeof genome.cognitive_tuning.pid === 'object'
        );
    }
}

// Ekspor sebagai singleton
export default new GenomeLoader();
