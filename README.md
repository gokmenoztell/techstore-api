# TechStore API

Laravel tabanlı, modüler yapıda tasarlanmış e-ticaret / teknoloji mağazası REST API ve React arayüz projesi. Kimlik doğrulama, rol tabanlı yönetim paneli, ürün yönetimi ve işlem güvenliği (`transaction` + satır kilitleme) odaklı sipariş sistemi içerir.

## Mimari ve Teknoloji Yığını

- **Backend:** Laravel (Sanctum, Form Requests, API Resources, Service katmanı)
- **Katmanlı Yapı:** Controller, Form Request, Service ve Resource ayrımı (`Auth`, `Products`, `Orders`)
- **Veritabanı ve Altyapı:** MySQL 8, Docker & Docker Compose
- **Veri Bütünlüğü ve Hesaplama:** Veritabanı transaction'ları, eşzamanlı stok koruması için satır kilitleme (`lockForUpdate`) ve hassas hesaplamalar için `bcmath`
- **Sipariş Durumları:** `pending`, `paid` ve `cancelled` durum geçişleri ile geçersiz durum değişikliklerine karşı doğrulama kuralları
- **Testler:** Feature testler (`tests/Feature/OrderApiTest.php`)

## Hızlı Başlangıç (Docker ile Tek Komut)

Bilgisayarınızda PHP, Node.js veya MySQL kurulu olmasına gerek olmadan tüm sistemi ayağa kaldırmak için:

```bash
git clone https://github.com/gokmenoztell/techstore-api.git
cd techstore-api
docker compose up --build -d
```

İlk kurulumda veritabanı tabloları ve örnek veriler henüz oluşmadıysa:

```bash
docker compose exec api php artisan migrate --seed --force
```
