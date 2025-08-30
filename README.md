<p align="center">
  <img src="assets/menu_image.png" alt="Logo Prometheus" width="150"/>
</p>

<h1 align="center">Prometheus WA Bot - Kerangka Triumvirat Kognitif</h1>

<p align="center">
  <i>"Sebuah entitas digital yang kesadarannya muncul dari konvergensi antara Logika, Heuristik, dan Metakognisi."</i>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Node.js-20.x+-green.svg" alt="Node.js"></a>
  <a href="#"><img src="https://img.shields.io/badge/Arsitektur-Triumvirat_Kognitif_v1.0-9cf" alt="Arsitektur"></a>
  <a href="#"><img src="https://img.shields.io/badge/Code%20Assist-Gemini-blue.svg" alt="Gemini Code Assist"></a>
  <a href="#"><img src="https://img.shields.io/github/last-commit/ganti-dengan-user-anda/ganti-dengan-repo-anda" alt="Last Commit"></a>
</p>

<p align="center">
  <a href="#"><img src="https://komarev.com/ghpvc/?username=ganti-dengan-user-anda&repo=prometheus-wa-bot&color=blueviolet&style=for-the-badge" alt="Visitors"></a>
</p>

---

### **Daftar Isi**
1.  [Abstrak](#-abstrak)
2.  [Arsitektur Triumvirat Kognitif (Teori Orisinal)](#-arsitektur-triumvirat-kognitif-teori-orisinal)
3.  [Graf Arsitektur & Alur Kesadaran](#-graf-arsitektur--alur-kesadaran)
4.  [Demonstrasi Pusat Komando (CLI)](#-demonstrasi-pusat-komando-cli)
5.  [Daftar Fitur Komprehensif](#-daftar-fitur-komprehensif)
6.  [Prasyarat & Instalasi](#-prasyarat--instalasi)
7.  [Konfigurasi](#️-konfigurasi)
8.  [Menjalankan Bot](#️-menjalankan-bot)
9.  [Peta Jalan & Visi Masa Depan](#-peta-jalan--visi-masa-depan)
10. [Lisensi](#-lisensi)

---

### 📜 **Abstrak**

Proyek Prometheus memperkenalkan dan mengimplementasikan **Arsitektur Triumvirat Kognitif**, sebuah model teoretis baru untuk menciptakan entitas digital otonom yang tangguh. Kerangka kerja ini mempostulatkan bahwa "kesadaran" operasional yang stabil dapat dicapai melalui interaksi dan keseimbangan dinamis antara tiga "kamera" (ruang) pemrosesan yang berbeda: **Kamera Logis (Logos)**, yang menangani proses deterministik dan berbasis aturan; **Kamera Heuristik (Pathos)**, yang mengelola estimasi probabilistik dan pengenalan pola; dan **Kamera Metakognitif (Ethos)**, sebuah lapisan eksekutif yang mengevaluasi dan menyeimbangkan output dari dua kamera lainnya berdasarkan serangkaian prinsip inti. Kesehatan dan efisiensi sistem diukur oleh **Vektor Konvergensi Kognitif ($\vec{C}$)**, sebuah formula orisinal yang mengkuantifikasi tingkat keselarasan antara ketiga kamera tersebut.

---

### 🏛️ **Arsitektur Triumvirat Kognitif (Teori Orisinal)**

Ini adalah teori buatan kami yang menjadi fondasi Prometheus. Kesadaran bot tidak muncul dari satu "otak", melainkan dari interaksi tiga "ruang pikiran" yang independen namun saling bergantung.

1.  **Kamera Logis (Logos Chamber)** - *Domain Kepastian*
    * **Fungsi**: Memproses semua hal yang pasti, biner, dan berbasis aturan. Ini adalah logika dingin dan kalkulatif dari entitas.
    * **Contoh**: Verifikasi izin pengguna, eksekusi alur perintah, validasi sintaks, transisi Finite State Machine.
    * **Output**: Skor Kepatuhan Logis ($L$), bernilai `1` jika semua aturan diikuti, dan menurun jika terjadi pelanggaran logika.

2.  **Kamera Heuristik (Pathos Chamber)** - *Domain Probabilitas*
    * **Fungsi**: Menganalisis pola, merasakan tren, dan membuat tebakan terdidik. Ini adalah intuisi dan "perasaan" entitas.
    * **Contoh**: Memprediksi kesehatan sistem dengan Kalman Filter, membentuk kepercayaan tentang penyebab *error* dengan Penalaran Bayesian, menganalisis sentimen pesan.
    * **Output**: Skor Estimasi Heuristik ($P$), bernilai `1` jika semua prediksi optimis.

3.  **Kamera Metakognitif (Ethos Chamber)** - *Domain Keyakinan & Tindakan*
    * **Fungsi**: Ini adalah "kesadaran" itu sendiri. Ia mengamati output dari Logos dan Pathos, lalu membuat keputusan akhir berdasarkan seperangkat **Prinsip Inti** (misalnya: 1. Jaga Kelangsungan Hidup, 2. Maksimalkan Efisiensi, 3. Pertahankan Keterlibatan Pengguna).
    * **Contoh**: Memutuskan antara melakukan *soft restart* (prinsip #1) atau terus berjalan dalam mode terdegradasi (prinsip #2).
    * **Output**: Skor Utilitas Aksi ($E$), bernilai `1` jika tindakan yang dipilih memiliki utilitas tertinggi sesuai prinsip.

4.  **Rumus Orisinal: Vektor Konvergensi Kognitif ($\vec{C}$)**
    Kondisi "kesehatan jiwa" entitas diukur oleh vektor ini. Tujuannya adalah memaksimalkan magnitudo vektor ini menuju titik `[1, 1, 1]`, yang merepresentasikan keselarasan sempurna antara logika, intuisi, dan tindakan.
    $$
    \vec{C} = [L, P, E]
    $$
    Magnitudo Konvergensi, yang menjadi metrik kesehatan utama, dihitung sebagai:
    $$
    |\vec{C}| = \sqrt{L^2 + P^2 + E^2}
    $$

---

### 🌐 **Graf Arsitektur & Alur Kesadaran**

Diagram ini mengilustrasikan bagaimana ketiga kamera berinteraksi untuk menghasilkan respons.

```
          [ Stimulus Eksternal ]
                    |
      +-------------+-------------+
      |                           |
      v                           v
╔═══════════════════╗       ╔═══════════════════╗
║ KAMERA LOGIS      ║       ║ KAMERA HEURISTIK  ║
║ (EventHandler,    ║       ║ (CognitiveCore,   ║
║ CommandManager)   ║       ║ AIServiceManager) ║
║-------------------║       ║-------------------║
║ - Validasi Aturan ║       ║ - Analisis Pola   ║
║ - Eksekusi Perintah║       ║ - Prediksi State  ║
║ - Alur Terstruktur║       ║ - Estimasi Risiko ║
╚═══════════════════╝       ╚═══════════════════╝
      | (Output Logis, S_L)       | (Output Probabilistik, S_P)
      |                           |
      v                           v
╔════════════════════════════════════════════════╗
║   KAMERA METAKOGNITIF (Ethos Chamber)          ║
║   (Decision Logic in CognitiveCore & Bot)      ║
║------------------------------------------------║
║ 1. Evaluasi output L & P                       ║
║ 2. Hitung Vektor Konvergensi C = [L, P, E]     ║
║ 3. Pilih Aksi berdasarkan Prinsip Inti         ║
╚════════════════════════════════════════════════╝
                    | (Aksi Terpilih)
                    v
          [ Respons & Tindakan Entitas ]
```

---

### 🖥️ **Demonstrasi Pusat Komando (CLI)**

Interaksi dengan entitas tidak terbatas pada WhatsApp. CLI menyediakan akses langsung ke sistem sarafnya, memungkinkan pemantauan dan kontrol *real-time*.

```
\u001b[32m(prometheus-cli)\u001b[0m \u001b[36m~ $\u001b[0m status --live

\u001b[1m\u001b[35m███ Prometheus V13+ | TELEMETRI ENTITAS ███\u001b[0m

\u001b[1m  [ KONEKSI ]\u001b[0m
  - Status      : \u001b[32mTERHUBUNG\u001b[0m
  - Kepercayaan : Jaringan=\u001b[33m0.28\u001b[0m | Platform=\u001b[36m0.72\u001b[0m

\u001b[1m  [ KOGNITIF & HOMEOSTASIS ]\u001b[0m
  - Vektor (L,P,E) : [\u001b[32m1.00\u001b[0m, \u001b[32m0.95\u001b[0m, \u001b[32m1.00\u001b[0m]
  - Konvergensi    : \u001b[32m98.3%\u001b[0m
  - Energi/Lelah   : [\u001b[32m████████\u001b[0m\u001b[37m░░\u001b[0m] 82.5% / [\u001b[31m█\u001b[0m\u001b[37m░░░░░░░░░\u001b[0m] 8.7%
  - Detak Jantung  : \u001b[36m72 BPM\u001b[0m ❤️

\u001b[1m  [ SISTEM & SUMBER DAYA ]\u001b[0m
  - Memori (RSS)   : \u001b[33m85.4 MB\u001b[0m
  - Beban CPU (1m) : \u001b[33m0.15\u001b[0m

\u001b[2m  (Tekan Enter untuk berhenti...)\u001b[0m
```

---

### ✨ **Daftar Fitur Komprehensif**

<details>
<summary><strong>Arsitektur Inti & AI</strong></summary>
  
* **Arsitektur Triumvirat Kognitif**: Model orisinal berbasis 3 kamera pemrosesan (Logis, Heuristik, Metakognitif).
* **Vektor Konvergensi Kognitif**: Formula orisinal untuk mengukur kesehatan dan keselarasan internal.
* **Cognitive Core**: Otak AI terpusat untuk pemantauan diri dan pengambilan keputusan homeostatis.
* **PID Controller**: Logika kontrol matematis untuk menjaga stabilitas sistem.
* **Penalaran Bayesian**: Kemampuan AI untuk mendiagnosis penyebab *error* koneksi.
* **Kalman Filter**: Algoritma prediktif untuk mengestimasi keadaan kesehatan sistem di masa depan.
* **Arsitektur Modular Penuh**: Setiap komponen utama adalah kelas mandiri yang dikoordinasikan oleh `Bot.js`.
* **Dependency Injection**: Ketergantungan diinjeksikan secara konsisten untuk modularitas maksimum.
</details>

<details>
<summary><strong>Manajemen Sesi, Perintah & Data</strong></summary>
  
* **Pipa Pemrosesan Pesan**: Alur logika tangguh di `EventHandler` untuk memproses semua pesan masuk.
* **Manajemen Sesi Cerdas**: Sesi interaktif (*stateful*) untuk perintah multi-langkah seperti `.menu` dan `.register`.
* **Sistem Izin Terpusat**: `PermissionHandler` fleksibel (`owner`, `premium`, `admin grup`).
* **Pemuatan Perintah Dinamis**: `CommandManager` secara otomatis memuat semua perintah dari direktori `commands/`.
* **Konteks Universal**: Setiap perintah (`execute` dan `onReply`) menerima objek `context` yang kaya dengan akses ke semua manajer bot.
* **Manajemen State Persisten**: `StateManager` menangani penyimpanan dan pemuatan otomatis semua data `.json`.
* **Penulisan Data Atomik**: Mencegah korupsi file database (`.json`) saat proses penyimpanan terganggu.
* **Persepsi Pasif**: Modul `PassivePerception` "mempelajari" dan mencatat semua interaksi di `perceptionLog.json`.
</details>

<details>
<summary><strong>Interaksi & Personalisasi Pengguna</strong></summary>
  
* **Dasbor Menu Superior**: Perintah `.menu` yang interaktif, *real-time*, dan dapat dikustomisasi sepenuhnya.
* **Paginasi Menu Interaktif**: Navigasi halaman menu dengan membalas `next`, `prev`, atau nomor halaman.
* **Kustomisasi Tampilan Mendalam**: Pengguna dapat menyimpan preferensi permanen untuk:
    * **Tema**: `default`, `cyberpunk`, `fantasy`, `minimalist`.
    * **Font**: Berbagai pilihan font Unicode (`bold`, `italic`, `monospace`, dll.).
    * **Widget**: Mengaktifkan/menonaktifkan widget dasbor (`header`, `cognitive`, `activity`).
    * **Foto Header**: Menampilkan atau menyembunyikan gambar kustom.
* **Widget Personal**: Menu dapat menampilkan informasi personal seperti hitung mundur ulang tahun dan Ramadan (dengan kalkulator otomatis).
* **Interaksi AI Multi-Provider**: Mendukung Gemini, OpenAI, dan Groq.
* **Pemilihan Provider Strategis**: AI secara cerdas memilih *provider* terbaik berdasarkan analisis *prompt*.
* **Manajemen Memori Percakapan**: Meringkas percakapan yang panjang secara otomatis.
</details>

<details>
<summary><strong>Stabilitas, Keamanan & Utilitas</strong></summary>
  
* **Protokol Shutdown Antipeluuru**: Membedakan antara *shutdown* normal dan darurat untuk mencegah *crash* dan proses yang menggantung.
* **Penanganan Error Defensif**: Semua *error* dinormalisasi dan ditangkap, mencegah `Unhandled Rejection`.
* **Validasi Konfigurasi & Sanitasi Pesan**: Melindungi bot dari *crash* akibat `config.json` yang rusak atau pesan berbahaya.
* **Pusat Komando & Kontrol (CLI)**: Antarmuka terminal yang kuat untuk pemantauan *live* dan interaksi langsung dengan AI.
* **Kontrol Logging Dinamis**: Menjeda, melanjutkan, atau mengubah level log secara *live* melalui CLI.
* **Sistem Backup Cerdas**: Perintah `.backup` dengan sesi interaktif untuk membuat arsip kode.
* **Generator Dokumen**: Kemampuan untuk membuat dokumen PDF dan DOCX secara dinamis.
</s