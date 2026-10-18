# SOLDE Cafe — Çay Ocağı Sipariş ve Takip

## Çalıştırma
```
npm.cmd install
npm.cmd run dev
```
- Müşteri: http://localhost:3000/s
- Ocak ekranı: http://localhost:3000/ekran
- Kasa/Borç: http://localhost:3000/kasa (şifre: cems123)
- Admin: http://localhost:3000/admin (şifre: cems123)

Şifreyi değiştirmek için `.env.local` dosyası oluşturun:
```
ADMIN_PASSWORD=yeni-sifre
```

## Akış
1. Admin → ürün/fiyat + masa/dükkan gir, QR yazdır.
2. Müşteri QR → /s → sipariş verir.
3. Ocak /ekran → Bekliyor/Hazırlandı.
4. Kasa → Nakit Al veya Borca Yaz → Günlük Rapor + Borç Defteri.

## Notlar
- Veriler `data/db.json` dosyasında tutulur (MVP). İnternette kalıcı + çok cihaz için sonraki adım: Supabase/Postgres.
- Ocak ekranı 3 sn'de bir yenilenir + yeni siparişte ses çıkarır.
