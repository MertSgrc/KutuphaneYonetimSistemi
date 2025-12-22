package com.mert.kutuphane.controller;

import com.mert.kutuphane.model.*;
import com.mert.kutuphane.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") 
public class LibraryController {

    @Autowired private KitapRepository kitapRepo;
    @Autowired private KategoriRepository kategoriRepo;
    @Autowired private UyeRepository uyeRepo;
    @Autowired private PersonelRepository personelRepo;
    @Autowired private OduncRepository oduncRepo;
    
    // Mail Gönderici (Otomatik bağlanır)
    @Autowired private JavaMailSender mailSender;

    // --- YARDIMCI METOD: MAIL GÖNDER ---
    private void sendVerificationEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("SENIN_MAIL_ADRESIN@gmail.com"); // properties'deki mailin aynısı olmalı
        message.setTo(toEmail);
        message.setSubject("Kütüphane Üyelik Doğrulama Kodu");
        message.setText("Merhaba,\n\nKayıt olduğunuz için teşekkürler. Doğrulama kodunuz: " + code + "\n\nİyi okumalar!");
        mailSender.send(message);
    }

    // --- 1. GİRİŞ (LOGIN) ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String identifier = creds.get("username");
        String password = creds.get("password");

        // Personel Kontrolü 
        List<Personel> personeller = personelRepo.findAll();
        for(Personel p : personeller) {
            if(p.getKullaniciAdi().equals(identifier) && p.getSifre().equals(password)) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", p.getPersonel_id());
                response.put("ad", p.getPersonel_ad());
                response.put("yetki", p.getYetki());
                response.put("roleType", "staff");
                return ResponseEntity.ok(response);
            }
        }

       
        List<Uye> uyeler = uyeRepo.findAll();
        for(Uye u : uyeler) {
            if(u.getUyeEmail() != null && u.getUyeEmail().equals(identifier) && u.getSifre().equals(password)) {
    
                if (!u.isAktif()) {
                    return ResponseEntity.status(403).body("Hesabınız doğrulanmamış! Lütfen mailinize gelen kodu giriniz.");
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("id", u.getUye_id());
                response.put("ad", u.getUye_ad());
                response.put("roleType", "member");
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).body("Hatalı kullanıcı adı veya şifre");
    }

    // --- ÜYE İŞLEMLERİ  ---
    @GetMapping("/members")
    public List<Uye> getAllMembers() { return uyeRepo.findAll(); }

    @PostMapping("/members")
    public ResponseEntity<?> registerMember(@RequestBody Uye uye) {
        // E-posta kontrolü (Aynı mailden var mı?)
        List<Uye> mevcutUyeler = uyeRepo.findAll();
        for (Uye u : mevcutUyeler) {
            if (u.getUyeEmail() != null && u.getUyeEmail().equals(uye.getUyeEmail())) {
                return ResponseEntity.badRequest().body("Bu e-posta adresi zaten kayıtlı!");
            }
        }

        // Kod Üret (6 Haneli Rastgele Sayı)
        String code = String.valueOf(new Random().nextInt(900000) + 100000);
        uye.setDogrulamaKodu(code);
        uye.setAktif(false); // Başlangıçta pasif
        
        if (uye.getUyeKayitTarihi() == null) uye.setUyeKayitTarihi(LocalDate.now());
        
        try {
            // Önce veritabanına kaydet
            Uye savedUye = uyeRepo.save(uye);
            
            // Sonra mail at
            sendVerificationEmail(uye.getUyeEmail(), code);
            
            return ResponseEntity.ok(savedUye);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Mail gönderilemedi: " + e.getMessage());
        }
    }
    
    
    @PostMapping("/verify")
    public ResponseEntity<?> verifyAccount(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("code");
        
        List<Uye> uyeler = uyeRepo.findAll();
        for(Uye u : uyeler) {
            if(u.getUyeEmail() != null && u.getUyeEmail().equals(email)) {
               
                if(u.getDogrulamaKodu() != null && u.getDogrulamaKodu().equals(code)) {
                    u.setAktif(true); 
                    uyeRepo.save(u);
                    
                    return ResponseEntity.ok(Collections.singletonMap("message", "Doğrulama başarılı! Giriş yapabilirsiniz."));
                } else {
                    return ResponseEntity.badRequest().body("Hatalı doğrulama kodu!");
                }
            }
        }
        return ResponseEntity.badRequest().body("Kullanıcı bulunamadı.");
    }
    
   @DeleteMapping("/members/{id}")
    public ResponseEntity<?> deleteMember(@PathVariable int id) {
        // 1. Üyenin üzerinde ödünç kitap var mı kontrol et
        List<Odunc> tumOduncler = oduncRepo.findAll();
        boolean oduncVarMi = false;
        
        for(Odunc o : tumOduncler) {
            // Odunc tablosundaki uyeId ile silinmek istenen id eşleşiyor mu?
            if(o.getUyeId() == id) {
                oduncVarMi = true;
                break;
            }
        }

        if (oduncVarMi) {
            // Eğer üzerinde kitap varsa silme işlemini durdur ve hata mesajı dön
            return ResponseEntity.badRequest().body("Bu üyenin üzerinde iade edilmemiş kitaplar var! Önce kitapları teslim almalısınız.");
        }

        // 2. Engel yoksa üyeyi sil
        uyeRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/books") public List<Kitap> getAllBooks() { return kitapRepo.findAll(); }
    @PostMapping("/books") public Kitap addBook(@RequestBody Kitap kitap) { return kitapRepo.save(kitap); }
    @DeleteMapping("/books/{id}") public void deleteBook(@PathVariable int id) { kitapRepo.deleteById(id); }
    @GetMapping("/categories") public List<Kategori> getCategories() { return kategoriRepo.findAll(); }
    @PostMapping("/categories") public Kategori addCategory(@RequestBody Kategori k) { return kategoriRepo.save(k); }
    @DeleteMapping("/categories/{id}") 
    public ResponseEntity<?> deleteCategory(@PathVariable int id) {
        List<Kitap> tumKitaplar = kitapRepo.findAll();
        for(Kitap k : tumKitaplar) { if(k.getKategoriId() == id) return ResponseEntity.badRequest().body("Kitap var, silinemez!"); }
        kategoriRepo.deleteById(id); return ResponseEntity.ok().build();
    }
    @GetMapping("/loans") public List<Odunc> getAllLoans() { return oduncRepo.findAll(); }
    @PostMapping("/loans") 
    public ResponseEntity<?> addLoan(@RequestBody Odunc loan) {
        loan.setDurum("Aktif");
        if(loan.getOduncTarihi() == null) loan.setOduncTarihi(LocalDate.now());
        Optional<Kitap> k = kitapRepo.findById(loan.getKtpId());
        if(k.isPresent() && k.get().getKtpStok() > 0) {
            k.get().setKtpStok(k.get().getKtpStok() - 1); kitapRepo.save(k.get());
            return ResponseEntity.ok(oduncRepo.save(loan));
        }
        return ResponseEntity.badRequest().body("Stok yok veya kitap bulunamadı.");
    }

  @DeleteMapping("/loans/{id}") 
    public void returnLoan(@PathVariable int id) {
        Optional<Odunc> loan = oduncRepo.findById(id);
        if(loan.isPresent()) {
            Odunc odunc = loan.get();
            
            // Stok artır
            Optional<Kitap> k = kitapRepo.findById(odunc.getKtpId());
            if(k.isPresent()) {
                Kitap kitap = k.get();
                kitap.setKtpStok(kitap.getKtpStok() + 1);
                kitapRepo.save(kitap);
            }
            
            // Durum güncelle
            odunc.setDurum("İade Edildi");
            odunc.setOdemeYapildi(false); // Normal iade, özel ödeme yok
            oduncRepo.save(odunc);
        }
    }

    // --- 2. YENİ: CEZA ÖDEYEREK İADE ETME ---
    @PostMapping("/loans/{id}/pay")
    public ResponseEntity<?> payFine(@PathVariable int id) {
        Optional<Odunc> loan = oduncRepo.findById(id);
        if(loan.isPresent()) {
            Odunc odunc = loan.get();
            
            // Stok artır
            Optional<Kitap> k = kitapRepo.findById(odunc.getKtpId());
            if(k.isPresent()) {
                Kitap kitap = k.get();
                kitap.setKtpStok(kitap.getKtpStok() + 1);
                kitapRepo.save(kitap);
            }
            
            // Durum güncelle ve ÖDEME YAPILDI işaretle
            odunc.setDurum("İade Edildi");
            odunc.setOdemeYapildi(true);           
            oduncRepo.save(odunc);
           return ResponseEntity.ok(Collections.singletonMap("message", "Ödeme alındı ve iade edildi."));
        }
        return ResponseEntity.badRequest().body("Kayıt bulunamadı");
    }

    @GetMapping("/staff") public List<Personel> getStaff() { return personelRepo.findAll(); }
    @PostMapping("/staff") public Personel addStaff(@RequestBody Personel p) { return personelRepo.save(p); }
    @DeleteMapping("/staff/{id}") public void deleteStaff(@PathVariable int id) { personelRepo.deleteById(id); }

    // --- BAKİYE YÜKLEME ---
    @PostMapping("/members/{id}/deposit")
    public ResponseEntity<?> depositMoney(@PathVariable int id, @RequestBody Map<String, Double> payload) {
        Double amount = payload.get("amount");
        Optional<Uye> u = uyeRepo.findById(id);
        
        if (u.isPresent()) {
            Uye uye = u.get();
            Double mevcut = uye.getBakiye() != null ? uye.getBakiye() : 0.0;
            uye.setBakiye(mevcut + amount);
            uyeRepo.save(uye);
            
            // Güncel bakiyeyi dön
            return ResponseEntity.ok(Collections.singletonMap("message", "Bakiye yüklendi. Yeni bakiyeniz: " + uye.getBakiye() + " TL"));
        }
        return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Üye bulunamadı"));
    }

    // --- CÜZDANDAN CEZA ÖDEYEREK İADE ---
    @PostMapping("/loans/{id}/pay-wallet")
    public ResponseEntity<?> payFineFromWallet(@PathVariable int id, @RequestBody Map<String, Double> payload) {
        Double cezaTutari = payload.get("amount");
        
        Optional<Odunc> loan = oduncRepo.findById(id);
        if(!loan.isPresent()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Ödünç kaydı bulunamadı"));
        
        Odunc odunc = loan.get();
        Optional<Uye> u = uyeRepo.findById(odunc.getUyeId());
        
        if (u.isPresent()) {
            Uye uye = u.get();
            Double bakiye = uye.getBakiye() != null ? uye.getBakiye() : 0.0;

            // YETERLİ BAKİYE KONTROLÜ
            if (bakiye < cezaTutari) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Yetersiz bakiye! Lütfen önce para yükleyin."));
            }

            // 1. Bakiyeden düş
            uye.setBakiye(bakiye - cezaTutari);
            uyeRepo.save(uye);

            // 2. Kitap Stoğunu Artır
            Optional<Kitap> k = kitapRepo.findById(odunc.getKtpId());
            if(k.isPresent()) {
                Kitap kitap = k.get();
                kitap.setKtpStok(kitap.getKtpStok() + 1);
                kitapRepo.save(kitap);
            }

            // 3. Durumu Güncelle
            odunc.setDurum("İade Edildi");
            odunc.setOdemeYapildi(true);
            oduncRepo.save(odunc);

            return ResponseEntity.ok(Collections.singletonMap("message", "Cüzdandan ödendi ve iade alındı."));
        }
        return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Üye bulunamadı"));
    }
}