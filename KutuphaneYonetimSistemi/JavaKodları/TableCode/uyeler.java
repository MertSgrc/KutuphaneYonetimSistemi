package TableCode;

import java.sql.Date;

public class uyeler {

    private int uye_id;
    private String uye_ad;
    private String uye_soyad;
    private String uye_email;
    private String uye_telefon;
    private Date uye_kayit_tarihi;

    public int getUye_id() {
        return uye_id;
    }
    public void setUye_id(int uye_id) {
        this.uye_id = uye_id;
    }
    public String getUye_ad() {
        return uye_ad;
    }
    public void setUye_ad(String uye_ad) {
        this.uye_ad = uye_ad;
    }
    public String getUye_soyad() {
        return uye_soyad;
    }
    public void setUye_soyad(String uye_soyad) {
        this.uye_soyad = uye_soyad;
    }
    public String getUye_email() {
        return uye_email;
    }
    public void setUye_email(String uye_email) {
        this.uye_email = uye_email;
    }
    public String getUye_telefon() {
        return uye_telefon;
    }
    public void setUye_telefon(String uye_telefon) {
        this.uye_telefon = uye_telefon;
    }
    public Date getUye_kayit_tarihi() {
        return uye_kayit_tarihi;
    }
    public void setUye_kayit_tarihi(Date uye_kayit_tarihi) {
        this.uye_kayit_tarihi = uye_kayit_tarihi;
    }
    public uyeler(String uye_ad, String uye_soyad, String uye_email, String uye_telefon, Date uye_kayit_tarihi) {
        setUye_ad(uye_ad);
        setUye_soyad(uye_soyad);
        setUye_email(uye_email);
        setUye_telefon(uye_telefon);
        setUye_kayit_tarihi(uye_kayit_tarihi);
    }
    
    
}
