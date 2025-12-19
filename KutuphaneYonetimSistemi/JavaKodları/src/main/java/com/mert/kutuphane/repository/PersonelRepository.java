package com.mert.kutuphane.repository;
import com.mert.kutuphane.model.Personel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PersonelRepository extends JpaRepository<Personel, Integer> {
    Optional<Personel> findByKullaniciAdiAndSifre(String kullaniciAdi, String sifre);
}