# 📜 Teori & Konsep Inti: Kerangka Genom Sibernetik

Kerangka Genom Sibernetik adalah fondasi dari Prometheus. Teori ini menyatakan bahwa kepribadian dan perilaku sebuah entitas digital dapat dan harus dipisahkan dari logika operasional intinya.

- **Raga (Core Logic)**: Kode JavaScript (`.js`) yang membentuk tubuh operasional bot. Ia tangguh, efisien, dan fokus pada eksekusi.
- **Jiwa (Genome)**: File eksternal (`.cml`) yang mendefinisikan kepribadian, prinsip, dan refleks. Ia bersifat deklaratif dan mudah diubah.

Pemisahan ini memungkinkan "jiwa" bot (kepribadiannya) untuk berevolusi tanpa harus merekayasa ulang "raganya" (kode inti).

## Cognitive Markup Language (`.cml`)
`.cml` adalah bahasa spesifik domain yang kami ciptakan untuk mendefinisikan genom ini. Ia memiliki beberapa bagian utama:

- **`persona`**: Identitas dasar entitas.
- **`ethos`**: Prinsip-prinsip inti yang tidak bisa dilanggar, bertindak sebagai moderator untuk V-Field.
- **`reflex_arc`**: Aturan `event -> action` sederhana untuk reaksi cepat.
- **`cognitive_tuning`**: Parameter untuk menyetel model AI internal.