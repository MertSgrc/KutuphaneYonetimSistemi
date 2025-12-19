package com.mert.kutuphane.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "kitaplar")
@Data
public class Kitap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ktp_id")
    private int ktpId;
    
    @Column(name = "kategori_id")
    private int kategoriId;
    
    @Column(name = "ktp_ad")
    private String ktpAd;
    
    private String yazar;
    
    @Column(name = "yayin_yili")
    private LocalDate yayinYili;
    
    @Column(name = "ktp_stok")
    private int ktpStok;
    
    private String durum;
    
    @Column(name = "kitap_resim")
    private String kitapResim;
}