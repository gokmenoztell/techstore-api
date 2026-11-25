# TechStore API

Laravel tabanlı, modüler yapıda tasarlanmış e-ticaret / teknoloji mağazası REST API ve React arayüz projesi. Kimlik doğrulama, rol tabanlı yönetim paneli, ürün yönetimi ve işlem güvenliği (`transaction` + satır kilitleme) odaklı sipariş sistemi içerir.

## Mimari ve Teknoloji Yığını

- **Backend:** Laravel (Sanctum, Form Requests, API Resources, Service katmanı)
- **Katmanlı Yapı:** Controller, Form Request, Service ve Resource ayrımı (`Auth`, `Products`, `Orders`)
- **Veritabanı ve Altyapı:** MySQL 8, Docker & Docker Compose
- **Veri Bütünlüğü ve Hesaplama:** Veritabanı transaction'ları, eşzamanlı stok koruması için satır kilitleme (`lockForUpdate`) ve hassas hesaplamalar için `bcmath`
- **Sipariş Durumları:** `pending`, `paid` ve `cancelled` durum geçişleri ile geçersiz durum değişikliklerine karşı doğrulama kuralları
- **Testler:** Feature testler (`tests/Feature/OrderApiTest.php`)

## Hızlı Başlangıç (Docker ile)

Bilgisayarınızda PHP, Node.js veya MySQL kurulu olmasına gerek olmadan sistemi ayağa kaldırmak için aşağıdaki adımları sırayla uygulayın:

### 1. Repoyu klonlayın ve `.env` dosyasını hazırlayın

```bash
git clone [https://github.com/gokmenoztell/techstore-api.git](https://github.com/gokmenoztell/techstore-api.git)
cd techstore-api
```

`backend/.env` dosyası yoksa ve `backend/.env.example` bulunuyorsa kopyalayın (veya `docker-compose.yml` içindeki ortam değişkenlerinin veritabanı ayarlarıyla uyumlu olduğunu kontrol edin):

```bash
cp backend/.env.example backend/.env
```

_(Windows PowerShell kullanıyorsanız `Copy-Item backend\.env.example backend\.env` komutunu çalıştırabilirsiniz.)_

### 2. Port çakışmalarını kontrol edin ve servisleri başlatın

Container'ların kullanacağı portlarda (`8000` API, `5173` veya `80` web/nginx, `3306` MySQL) başka bir servis çalışmadığından emin olun, ardından servisleri ayağa kaldırın:

```bash
docker compose up --build -d
```

### 3. MySQL hazır olduktan sonra migration ve seed çalıştırın

İlk kurulumda veritabanı tabloları ve örnek veriler henüz oluşmadıysa şu komutu çalıştırın:

```bash
docker compose exec api php artisan migrate --seed --force
```

> **Not:** `docker compose up --build -d` komutu tamamlandığında MySQL servisi bağlantıları kabul etmeye henüz tam hazır olmayabilir. Migration sırasında kısa süreli bağlantı hatası alırsanız birkaç saniye bekleyip aynı `migrate --seed --force` komutunu tekrar çalıştırın.
