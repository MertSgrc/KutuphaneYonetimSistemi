package com.mert.kutuphane.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "odunc")
@Data // Lombok ile Getter/Setter/ToString otomatik oluşturulur
public class Odunc {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "odunc_id")
    @JsonProperty("odunc_id") // Frontend'den gelen 'odunc_id'yi bu alana bağlar
    private int oduncId;
    
    @Column(name = "odunc_tarihi")
    @JsonProperty("odunc_tarihi")
    private LocalDate oduncTarihi;
    
    @Column(name = "iade_tarihi")
    @JsonProperty("iade_tarihi")
    private LocalDate iadeTarihi;
    
    private String durum;
    
    @Column(name = "uye_id")
    @JsonProperty("uye_id") // Frontend'den gelen 'uye_id'yi bu alana bağlar
    private int uyeId;
    
    @Column(name = "ktp_id")
    @JsonProperty("ktp_id") // Frontend'den gelen 'ktp_id'yi bu alana bağlar
    private int ktpId;

    @Column(name = "odeme_yapildi")
    @JsonProperty("odeme_yapildi") 
    private Boolean odemeYapildi = false;
}