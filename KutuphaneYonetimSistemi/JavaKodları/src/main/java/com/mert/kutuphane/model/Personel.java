package com.mert.kutuphane.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import lombok.Data;

@Entity @Table(name = "personel") @Data
public class Personel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int personel_id;
    
    private String personel_ad;
    private String personel_soyad;
    
    @Column(name = "kullanici_adi")
    private String kullaniciAdi; 
    
    private String sifre;
    private String yetki;
}