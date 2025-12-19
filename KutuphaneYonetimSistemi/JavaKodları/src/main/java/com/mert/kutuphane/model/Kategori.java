package com.mert.kutuphane.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "kategoriler")
@Data
public class Kategori {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kategori_id")
    private int kategoriId;
    
    @Column(name = "kategori_ad")
    private String kategoriAd;
}