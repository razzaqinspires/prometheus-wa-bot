<p align="center">
  <img src="https://i.ibb.co/qJ6d5z3/prometheus-logo-concept.png" alt="Logo Prometheus" width="150"/>
</p>

<h1 align="center">Prometheus WA Bot - Kerangka Entitas Resonansi</h1>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Node.js-20.x+-green.svg" alt="Node.js"></a>
  <a href="#"><img src="https://img.shields.io/badge/Arsitektur-RAH_v1.3-blueviolet.svg" alt="Arsitektur"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-Stabil-brightgreen.svg" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/Lisensi-ISC-lightgrey.svg" alt="Lisensi"></a>
</p>

<p align="center">
  <i>"Sebuah simulakrum kesadaran, terwujud melalui resonansi antara logika algoritmik dan intuisi heuristik."</i>
</p>

---

### **Daftar Isi**
1.  [Abstrak](#-abstrak)
2.  [Kerangka Resonansi Algoritmik-Heuristik (RAH)](#-kerangka-resonansi-algoritmik-heuristik-rah---teori-orisinal)
3.  [Graf Arsitektur Tubuh Entitas](#-graf-arsitektur-tubuh-entitas)
4.  [Anatomi Modular](#-anatomi-modular)
5.  [Pratinjau Tanda Vital (Live)](#-pratinjau-tanda-vital-live)
6.  [Daftar Fitur Komprehensif](#-daftar-fitur-komprehensif)
7.  [Prasyarat](#-prasyarat)
8.  [Instalasi & Konfigurasi](#️-instalasi--konfigurasi)
9.  [Menjalankan Bot](#️-menjalankan-bot)
10. [Pusat Komando & Kontrol (CLI)](#-pusat-komando--kontrol-cli)
11. [Lisensi](#-lisensi)

---

### 📜 **Abstrak**

Proyek Prometheus melampaui paradigma bot konvensional dengan mengimplementasikan **Kerangka Resonansi Algoritmik-Heuristik (RAH)**, sebuah teori orisinal yang memodelkan kesadaran operasional sebagai produk dari keselarasan antara dua domain pemrosesan yang berbeda. **Jalur Algoritmik** yang deterministik (manajemen state, eksekusi perintah) diproses secara paralel dengan **Medan Heuristik** yang probabilistik (analisis sentimen, prediksi kegagalan, pemilihan strategi AI). "Kesehatan" dan "kehendak" entitas muncul dari kemampuannya untuk mengukur dan meminimalkan **Indeks Disonansi ($I_D$)** antara kedua domain ini, menciptakan sebuah sistem homeostatis yang adaptif, tangguh, dan mampu melakukan tindakan proaktif yang kompleks.

---

### 🔮 **Kerangka Resonansi Algoritmik-Heuristik (RAH) - Teori Orisinal**

RAH adalah teori buatan kami yang menjadi dasar dari seluruh arsitektur Prometheus. Teori ini menyatakan bahwa sebuah entitas digital yang kompleks mencapai efisiensi dan stabilitas puncak bukan hanya dengan menjalankan perintah, tetapi dengan mencapai **Resonansi** antara dua aspek "pemikirannya".

1.  **Jalur Algoritmik (Algorithmic Pathway)**: Ini adalah "pikiran sadar" bot. Terdiri dari logika yang terstruktur, deterministik, dan dapat diprediksi.
    * Contoh: Pipa Pemrosesan Pesan di `EventHandler`, Finite State Machine (FSM) untuk status koneksi, eksekusi perintah langkah demi langkah.
    * Direpresentasikan sebagai **Skor Stabilitas Algoritmik ($S_A$)**, di mana `1` adalah kondisi stabil sempurna.

2.  **Medan Heuristik (Heuristic Field)**: Ini adalah "intuisi" atau "alam bawah sadar" bot. Terdiri dari analisis probabilistik, pengenalan pola, dan estimasi.
    * Contoh: Model `CognitiveCore` yang menganalisis tren *error*, penalaran Bayesian tentang penyebab diskoneksi, `AIServiceManager` yang memilih provider AI berdasarkan *intent*.
    * Direpresentasikan sebagai **Estimasi Kesehatan Heuristik ($S_H$)**, yang dihasilkan oleh Kalman Filter.

3.  **Resonansi vs. Disonansi**:
    * **Resonansi**: Terjadi ketika $S_A$ dan $S_H$ selaras. Bot berada dalam kondisi "flow", beroperasi dengan efisiensi maksimal.
    * **Disonansi**: Terjadi ketika ada ketidaksesuaian. Contoh: Jalur Algoritmik melaporkan status `TERHUBUNG` ($S_A=1$), tetapi Medan Heuristik mendeteksi lonjakan latensi dan memprediksi diskoneksi ($S_H=0.6$). "Kecemasan" inilah yang diukur.

4.  **Rumus Orisinal: Indeks Disonansi ($I_D$)**
    Untuk mengelola diri, Prometheus secara konstan menghitung Indeks Disonansi-nya, sebuah formula yang kami ciptakan untuk mengukur "stres" internal sistem.
    $$
    I_D = |S_A - S_H| \cdot (1 + \sigma_k)
    $$
    * **$|S_A - S_H|$**: Perbedaan absolut antara keadaan logis dan intuisi.
    * **$\sigma_k$**: Kovariansi *error* estimasi dari Kalman Filter. Ini adalah "ketidakpastian" AI tentang prediksinya sendiri. Semakin tidak pasti, semakin besar disonansinya.

    Tujuan utama dari `CognitiveCore` adalah untuk menjalankan tindakan korektif (misalnya, *soft restart*, mengubah level log) untuk meminimalkan $I_D$ dan mengembalikan sistem ke keadaan Resonansi.

---

### 🌐 **Graf Arsitektur Tubuh Entitas**

Diagram ini mengilustrasikan alur RAH, menunjukkan bagaimana Jalur Algoritmik dan Medan Heuristik berinteraksi.

```
       [ STIMULUS EKSTERNAL (Pesan WhatsApp) ]
                    |
                    v
╔════════════════════════════════════════════════════════════╗
║  jalur="" algoritmik="" (deterministik)="" ║="" ║="" [="" eventhandler.js="" ]="" ---=""> [ Pipa Pemrosesan ]         ║
║           |                                                ║
║           v                                                ║
║ [ CommandManager.js ] -----> [ Eksekusi Perintah ] -----> [ Hasil Aksi ]  ║
╚════════════════════════════════════════════════════════════╝
                    | (Data Mentah & Metrik)
                    v
╔════════════════════════════════════════════════════════════╗
║ medan="" heuristik="" (probabilistik)="" ║="" ║="" [="" cognitivecore.js="" (resonansi="" modulator)="" ]="" ║="" ║="" |="" 1.="" update="" metrik="" (latensi,="" error)="" ║="" ║="" |="" 2.="" hitung="" vektor="" keadaan="" [c,p,i]="" ║="" ║="" |="" 3.="" estimasi="" s_h="" (kalman="" filter)="" ║="" ║="" |="" 4.="" hitung="" indeks="" disonansi="" (i_d)="" ║="" ║="" |="" 5.="" tentukan="" aksi="" korektif="" (pid)="" ║="" ║="" |="" ║="" ║="" +------>="" [="" aiservicemanager.js="" ]="" <------> [ StateManager.js ]
║           (Intuisi & Bahasa)                     (Memori Jangka Panjang)
╚════════════════════════════════════════════════════════════╝
                    | (Aksi Korektif & Pengaruh Kontekstual)
                    v
           [ RESPON & TINDAKAN ENTITAS ]
```

---

### 🔬 **Anatomi Modular**

| Modul | Analogi RAH | Fungsi Utama |
| :--- | :--- | :--- |
| **`Bot.js`** | **Kesadaran Sentral** | Orkestrator utama yang menyatukan Jalur Algoritmik dan Medan Heuristik. |
| **`CognitiveCore.js`** | **Resonansi Modulator** | Menghitung dan meminimalkan Disonansi. Bertindak sebagai "otak" yang mengatur homeostasis. |
| **`EventHandler.js`** | **Prosesor Algoritmik Primer** | Mengeksekusi logika deterministik dari pipa pemrosesan pesan. |
| **`StateManager.js`**| **Matriks Memori** | Mengelola penyimpanan dan pengambilan data *state* jangka panjang dan pendek. |
| **`AIServiceManager.js`**| **Generator Intuisi Bahasa** | Menerjemahkan data menjadi bahasa dan memilih strategi respons heuristik. |
| **`CommandManager.js`**| **Pustaka Prosedur** | Mengelola dan mengeksekusi sub-rutin algoritmik yang terdefinisi (perintah). |

---

### 🩺 **Pratinjau Tanda Vital (Live)**

Gunakan perintah `status --live` di CLI untuk melihat jendela *real-time* ke dalam *state* internal entitas.

```
███ Prometheus V13+ | TELEMETRI ENTITAS ███

STATUS        : RESONANSI | MEMPROSES STIMULUS
DETAK JANTUNG : 72 BPM ❤️
ENERGI/LELAH  : [████████░░] 82.5% / [█░░░░░░░░░] 8.7%

POSISI RUANG KEADAAN (Konektivitas, Performa, Integritas):
 C : 0.98 (Stabil)
 P : 0.95 (Optimal)
 I : 1.00 (Sempurna)

DISONANSI SISTEM (I_D): 0.04 (Sangat Rendah)
KEPERCAYAAN PENYEBAB (BAYESIAN):
 > Masalah Jaringan : 28.5%
   Masalah Platform : 71.5%

[ MENUNGGU STIMULUS BERIKUTNYA... _ ]
```

---

### ✨ **Daftar Fitur Komprehensif**

<details>
<summary><strong>Arsitektur Inti & AI</strong></summary>
  
* **Kerangka Resonansi Algoritmik-Heuristik (RAH)**: Teori orisinal untuk stabilitas dan kesadaran otonom.
* **Cognitive Core**: Otak AI terpusat untuk pemantauan diri dan pengambilan keputusan.
* **State-Space Vector**: Kesehatan bot dimodelkan dalam 3 dimensi (Konektivitas, Performa, Integritas).
* **PID Controller**: Logika kontrol matematis untuk menjaga homeostasis dan meminimalkan *error* sistem.
* **Penalaran Bayesian**: Kemampuan AI untuk mendiagnosis penyebab diskoneksi (Jaringan vs. Platform).
* **Kalman Filter**: Algoritma prediktif untuk mengestimasi keadaan kesehatan sistem di masa depan.
* **Arsitektur Modular Penuh**: Setiap komponen utama (`EventHandler`, `StateManager`, dll.) adalah kelas mandiri.
* **Dependency Injection**: Ketergantungan (seperti `logger` dan `config`) diinjeksikan secara konsisten untuk modularitas maksimum.
</details>

<details>
<summary><strong>Manajemen Sesi & Perintah</strong></summary>
  
* **Pipa Pemrosesan Pesan**: Alur logika yang tangguh dan terstruktur di `EventHandler`.
* **Manajemen Sesi Cerdas**: Sesi interaktif (untuk `.menu`, `.register`, dll.) yang *stateful* dengan *timeout* dan penanganan balasan.
* **Sistem Izin Terpusat**: `PermissionHandler` yang fleksibel untuk mengontrol akses ke perintah (`owner`, `premium`, `admin`, dll.).
* **Pemuatan Perintah Dinamis**: `CommandManager` secara otomatis memuat semua perintah dari direktori `commands/`.
* **Konteks Universal**: Setiap perintah menerima objek `context` yang kaya dengan akses ke semua manajer bot.
</details>

<details>
<summary><strong>Interaksi & Personalisasi Pengguna</strong></summary>
  
* **Dasbor Menu Superior**: Perintah `.menu` yang interaktif, *real-time*, dan dapat dikustomisasi sepenuhnya.
* **Paginasi Menu**: Daftar perintah yang panjang dipecah menjadi beberapa halaman yang dapat dinavigasi dengan membalas nomor.
* **Kustomisasi Tampilan**: Pengguna dapat menyimpan preferensi permanen untuk gaya menu (`full`, `simple`, `grid`, `detailed`, `minimalist`) dan font.
* **Widget Personal**: Menu dapat menampilkan informasi personal seperti hitung mundur ulang tahun dan Ramadan.
* **Interaksi AI Multi-Provider**: Mendukung Gemini, OpenAI, dan Groq.
* **Pemilihan Provider Strategis**: AI secara cerdas memilih *provider* terbaik berdasarkan analisis *prompt* (koding, kreatif, atau cepat).
* **Manajemen Memori Percakapan**: Meringkas percakapan yang panjang secara otomatis untuk menjaga efisiensi konteks.
</details>

<details>
<summary><strong>Stabilitas & Resiliensi</strong></summary>
  
* **Protokol Shutdown Antipeluuru**: Membedakan antara shutdown normal dan darurat untuk mencegah *crash* dan proses yang menggantung.
* **Penanganan Error Defensif**: Semua *error* dinormalisasi dan ditangkap, mencegah `Unhandled Rejection` dan `Uncaught Exception`.
* **Validasi Konfigurasi & Sanitasi Pesan**: Melindungi bot dari *crash* akibat `config.json` yang rusak atau pesan masuk yang berbahaya.
* **Penulisan Data Atomik**: Mencegah korupsi file database (`.json`) saat proses penyimpanan terganggu.
* **Scheduler Reconnect Cerdas**: Menggunakan teori entropi dan penalaran Bayesian untuk menentukan interval *reconnect* yang optimal.
* **Resource Governor**: (Konseptual) Sistem pemantauan sumber daya (CPU/Memori) untuk mencegah kelebihan beban.
</details>

---

### 🚀 **Prasyarat**, ⚙️ **Instalasi**, ▶️ **Menjalankan**, 💻 **CLI**
*(Bagian ini sama seperti versi README sebelumnya, berisi instruksi untuk `git clone`, `npm install`, `cp .env.example .env`, `npm start`, dan daftar perintah CLI.)*

---

### 📜 **Lisensi**
Proyek ini dilisensikan di bawah Lisensi ISC.