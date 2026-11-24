# TechStore API

Laravel tabanlı, modüler yapıda tasarlanmış e-ticaret / teknoloji mağazası REST API projesi. Kimlik doğrulama, ürün yönetimi ve işlem güvenliği (`transaction` + satır kilitleme) odaklı sipariş yaşam döngüsünü içerir.

## Mimari ve Teknoloji Yığını

- **Framework:** Laravel (Sanctum, Form Requests, API Resources, Service katmanı)
- **Katmanlı Yapı:** Controller, Form Request, Service ve Resource ayrımı (`Auth`, `Products`, `Orders`)
- **Veri Bütünlüğü ve Hesaplama:** Veritabanı transaction'ları, eşzamanlı stok koruması için satır kilitleme (`lockForUpdate`) ve hassas hesaplamalar için `bcmath`
- **Sipariş Durumları:** `pending`, `paid` ve `cancelled` durum geçişleri ile geçersiz durum değişikliklerine karşı doğrulama kuralları
- **Testler:** Feature testler (`tests/Feature/OrderApiTest.php`)

## Kurulum

1. Depoyu klonla ve bağımlılıkları yükle:
    ```bash
    git clone <repo-url>
    cd techstore-api
    composer install
    ```

### 2. Değişikliği `main` Dalına Commit ve Push Et

Dosyayı kaydettikten sonra terminalde şu komutları çalıştır:

```powershell
git status
git add README.md
git commit -m "docs: update README with project architecture and setup guide"
git push origin main
```
