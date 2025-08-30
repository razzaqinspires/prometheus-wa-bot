# 🌐 Arsitektur & Anatomi Entitas Prometheus

Dokumen ini memberikan pandangan mendalam tentang arsitektur perangkat lunak yang membentuk entitas Prometheus. Arsitektur ini dirancang untuk modularitas, ketangguhan, dan implementasi praktis dari **Kerangka Genom Sibernetik**.

---

### **Graf Arsitektur & Alur Kesadaran**

Diagram Mermaid di bawah ini memvisualisasikan bagaimana empat medan fundamental—Observasi, Komputasi, Probabilistik, dan Volisional—berinteraksi untuk memproses stimulus menjadi respons yang cerdas. Ini adalah representasi visual dari "alur kesadaran" entitas.

```mermaid
graph TD;
    subgraph "Dunia Eksternal"
        A["Stimulus (Pesan, Event CLI, Timer)"]
    end

    subgraph "Entitas Prometheus"
        subgraph "O-Field (Persepsi / Indra)"
            B["Serializer & Sanitizer"]
        end

        subgraph "C-Field (Logika / Kausalitas)"
            C["EventHandler Pipeline"]
            D["CommandManager"]
            FSM["Finite State Machine"]
        end

        subgraph "P-Field (Intuisi / Probabilitas)"
            E["CognitiveCore"]
            F["AIServiceManager"]
            G["AutonomousTrigger"]
        end
        
        subgraph "V-Field (Kehendak / Aksi)"
            H["Action Execution Core (Metode di Bot.js)"]
        end
        
        A --> B;
        B --> C;
        C --> D;
        C -- Metrik Mentah --> E;
        D -- Konteks Lengkap --> F;
        E -- Rekomendasi Aksi --> H;
        F -- Kandidat Respons --> H;
        G -- Inisiatif Otonom --> H;
        C -- Perubahan Status --> FSM;
        H --> I[Aksi Nyata (Balas Pesan, Restart, dll.)];
    end

    subgraph "Dunia Eksternal "
        I --> J[Output ke Pengguna]
    end
    
    style A fill:#444,stroke:#fff
    style J fill:#444,stroke:#fff
    style B stroke:#0ff,stroke-width:2px
    style C stroke:#0f0,stroke-width:2px
    style E stroke:#f0f,stroke-width:2px
    style H stroke:#ff0,stroke-width:2px
```

---

### **Anatomi Modular: Pembagian Fungsi "Organ"**

Setiap file di dalam direktori `core/` dan `services/` berfungsi sebagai "organ" dengan tugas yang sangat spesifik. Pembagian ini memungkinkan pengembangan yang terisolasi dan stabilitas sistem secara keseluruhan.

| Modul | Analogi CSA | Fungsi Utama | Ketergantungan Inti |
| :--- | :--- | :--- | :--- |
| **`Bot.js`** | **Kesadaran Sentral** | Orkestrator utama. Menginisialisasi, menghubungkan (wiring), dan mengelola siklus hidup semua modul lain. | `Logger`, `GenomeLoader`, Semua Manajer |
| **`CognitiveCore.js`** | **Resonansi Modulator (P-Field)** | Otak AI internal. Mengkalkulasi Vektor Keadaan, menjalankan PID Controller & model Bayesian, dan menentukan kondisi homeostatis. | `Bot` (untuk akses `config` & `state`) |
| **`EventHandler.js`** | **Prosesor Algoritmik Primer (C-Field)**| Mengeksekusi pipa pemrosesan pesan yang logis dan berurutan untuk setiap stimulus yang masuk. | `Bot` (untuk akses ke semua manajer) |
| **`StateManager.js`**| **Matriks Memori** | Mengelola penyimpanan dan pengambilan data *state* jangka panjang (`.json`) dan jangka pendek (objek di memori). | `Logger` |
| **`AIServiceManager.js`**| **Generator Intuisi Bahasa (P-Field)** | Antarmuka ke LLM eksternal. Mengelola histori, memilih provider secara strategis, dan memformat respons. | `Bot` (untuk akses `config` & `logger`) |
| **`CommandManager.js`**| **Pustaka Prosedur (C-Field)** | Mengindeks, memuat ulang, dan menyediakan akses ke semua modul perintah yang tersedia di direktori `commands/`. | `Logger` |
| **`CLIEngine.js`**| **Mata Batin / Introspeksi** | Menyediakan antarmuka terminal interaktif untuk pemantauan *real-time* dan kontrol administratif. | `Bot` (untuk akses ke semua manajer) |
| **`AutonomousTrigger.js`**| **Sistem Saraf Otonom (P-Field)** | Menganalisis kondisi internal dan eksternal untuk secara proaktif menginisiasi interaksi atau tindakan. | `Bot` (untuk akses `CognitiveCore` & `AIServiceManager`) |
| **`serializer.js`**| **Neuron Sensorik (O-Field)**| Menerjemahkan data mentah dari Baileys menjadi objek `msg` yang terstandardisasi dan kaya akan konteks. | `sock`, `state`, `config`, `logger` |
| **`GenomeLoader.js`**| **Sekuenser DNA**| Membaca dan mem-parsing `persona.cml`, menerjemahkan "jiwa" bot menjadi konfigurasi yang dapat dieksekusi. | `Logger`, `yaml` |