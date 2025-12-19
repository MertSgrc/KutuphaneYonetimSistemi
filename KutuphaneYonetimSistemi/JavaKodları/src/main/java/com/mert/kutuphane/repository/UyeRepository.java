package com.mert.kutuphane.repository;
import com.mert.kutuphane.model.Uye;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UyeRepository extends JpaRepository<Uye, Integer> {
    Optional<Uye> findByUyeEmailAndSifre(String uyeEmail, String sifre);
}