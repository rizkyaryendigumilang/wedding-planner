# Panduan Pencadangan (Backup) & Pemulihan Bencana (Restore)

Dokumen ini menjelaskan strategi cadangan data ganda (*Dual-Layer Backup Strategy*) untuk aplikasi **Wedding Planner**, menjamin data tamu, checklist vendor, rundown acara, dan keuangan tetap aman serta siap dipulihkan seketika bila terjadi kendala teknis pada server VPS.

---

## 1. Dua Lapisan Pencadangan

| Lapisan | Target | Frekuensi | Cara Kerja | Lokasi Penyimpanan |
| :--- | :--- | :--- | :--- | :--- |
| **Lapisan 1: Snapshot JSON (Client / Admin)** | Data entitas (Tamu, Anggaran, Vendor, Rundown, Kado) | Manual / Sesuai Kebutuhan | Download 1-klik di menu **Pengaturan &gt; Cadangan** | Laptop / Google Drive pribadi pengantin |
| **Lapisan 2: VPS SQLite & Storage (.tar.gz)** | Seluruh database SQLite (`data.db`) + Foto/Media fisik (`storage/`) | Otomatis Harian (Cron) | Skrip `scripts/backup-pocketbase.sh` | `/opt/backups/wedding-planner/` di VPS |

---

## 2. Setup Pencadangan Otomatis di Server VPS (Linux)

Skrip cadangan otomatis telah disediakan di [`scripts/backup-pocketbase.sh`](../scripts/backup-pocketbase.sh). Skrip ini menggunakan API online backup SQLite (`sqlite3 .backup`) sehingga **aman dijalankan tanpa mematikan PocketBase** (tidak ada risiko korupsi WAL lock).

### Langkah 1: Berikan Izin Eksekusi
```bash
chmod +x /opt/wedding-planner/scripts/backup-pocketbase.sh
```

### Langkah 2: Tes Eksekusi Manual
```bash
/opt/wedding-planner/scripts/backup-pocketbase.sh
```
*Output yang diharapkan:*
```text
[2028-02-10 02:00:00] Memulai pencadangan PocketBase...
[2028-02-10 02:00:01] Menggunakan sqlite3 online backup API...
[2028-02-10 02:00:02] Menyalin folder uploads/storage...
[2028-02-10 02:00:03] Mengompresi berkas cadangan ke tar.gz...
[2028-02-10 02:00:04] Pencadangan berhasil! Ukuran arsip: 18M
[2028-02-10 02:00:04] Rotasi selesai. 0 arsip lama dihapus.
[2028-02-10 02:00:04] Status: SUKSES (Cadangan tersimpan di /opt/backups/wedding-planner/pocketbase_backup_20280210_020000.tar.gz)
```

### Langkah 3: Pasang Cron Job Harian
Buka editor crontab:
```bash
crontab -e
```
Tambahkan baris berikut untuk menjalankan pencadangan setiap hari pukul **02.00 WIB dini hari** dan mencatat log:
```cron
0 2 * * * /opt/wedding-planner/scripts/backup-pocketbase.sh >> /var/log/wedding-pb-backup.log 2>&1
```

---

## 3. Prosedur Pemulihan Data (Disaster Recovery)

### Skenario A: Pemulihan dari Berkas JSON (Web UI)
1. Masuk ke aplikasi Wedding Planner menggunakan akun pemilik (CPP / CPW).
2. Buka menu **Pengaturan** &gt; tab **Cadangan & Ekspor**.
3. Pada kartu **Pulihkan dari Berkas Cadangan (.json)**, klik **Pilih Berkas Cadangan**.
4. Pilih file `.json` snapshot terakhir.
5. Verifikasi ringkasan data yang muncul (jumlah tamu, pos anggaran, checklist vendor, rundown acara).

---

### Skenario B: Pemulihan Penuh Server VPS (Database SQLite + Foto)
Bila server mengalami kerusakan disk atau migrasi ke VPS baru:

1. **Hentikan service PocketBase:**
   ```bash
   sudo systemctl stop pocketbase
   ```

2. **Pilih arsip cadangan yang ingin dipulihkan:**
   ```bash
   ls -la /opt/backups/wedding-planner/
   # Contoh arsip: pocketbase_backup_20280210_020000.tar.gz
   ```

3. **Ekstraksi ke direktori PocketBase:**
   ```bash
   # Buat direktori sementara jika diperlukan
   mkdir -p /tmp/pb_restore
   tar -xzf /opt/backups/wedding-planner/pocketbase_backup_20280210_020000.tar.gz -C /tmp/pb_restore

   # Ganti data.db dan folder storage
   cp -a /tmp/pb_restore/data.db /opt/wedding-planner/pb_data/data.db
   rm -f /opt/wedding-planner/pb_data/data.db-wal /opt/wedding-planner/pb_data/data.db-shm

   if [ -d "/tmp/pb_restore/storage" ]; then
     cp -a /tmp/pb_restore/storage/* /opt/wedding-planner/pb_data/storage/
   fi

   # Bersihkan folder temporary
   rm -rf /tmp/pb_restore
   ```

4. **Pastikan kepemilikan berkas (permissions):**
   ```bash
   sudo chown -R www-data:www-data /opt/wedding-planner/pb_data
   ```

5. **Mulai kembali service PocketBase:**
   ```bash
   sudo systemctl start pocketbase
   sudo systemctl status pocketbase
   ```

---

## 4. Perlindungan Brute-Force & Rate Limiting (Nginx)

Untuk mencegah serangan tebak kata sandi (*brute-force login*) pada akun publik sebelum Go-Live, pasang batasan laju (*rate limiting*) pada konfigurasi Nginx VPS:

```nginx
# Di dalam blok http { ... } pada /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=pb_auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=pb_api_limit:10m rate=30r/s;

# Di dalam blok server { ... } pada domain wedding Anda
server {
    server_name wedding.domainanda.com;

    # Rate limiting khusus endpoint autentikasi login (maks 5 percobaan/menit)
    location /api/collections/users/auth-with-password {
        limit_req zone=pb_auth_limit burst=3 nodelay;
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy umum PocketBase API
    location /api/ {
        limit_req zone=pb_api_limit burst=50 nodelay;
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Setelah mengubah konfigurasi, uji dan terapkan:
```bash
sudo nginx -t && sudo systemctl reload nginx
```
