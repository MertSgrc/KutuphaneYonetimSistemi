package com.mert.kutuphane.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity @Table(name = "uyeler") @Data
public class Uye {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int uye_id; // Primary key'i olduğu gibi bıraktık
    
    private String uye_ad;
    private String uye_soyad;
    private String uye_telefon;
    
    @Column(name = "uye_email") 
    private String uyeEmail; // Java'da camelCase, DB'de snake_case
    
    @Column(name = "uye_kayıt_tarihi")
    private LocalDate uyeKayitTarihi;
    
    private String sifre;

    private String dogrulamaKodu; 
    private boolean aktif = false;
    
    private Double bakiye = 0.0;

    

}