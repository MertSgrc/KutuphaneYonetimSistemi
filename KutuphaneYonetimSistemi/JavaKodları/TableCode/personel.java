package TableCode;

public class personel {
    private int personel_id;
    private String personel_ad;
    private String personel_soyad;
    private String kullanici_adi;
    private String sifre;
    private String yetki;
    public int getPersonel_id() {
        return personel_id;
    }
    public void setPersonel_id(int personel_id) {
        this.personel_id = personel_id;
    }
    public String getPersonel_ad() {
        return personel_ad;
    }
    public void setPersonel_ad(String personel_ad) {
        this.personel_ad = personel_ad;
    }
    public String getPersonel_soyad() {
        return personel_soyad;
    }
    public void setPersonel_soyad(String personel_soyad) {
        this.personel_soyad = personel_soyad;
    }
    public String getKullanici_adi() {
        return kullanici_adi;
    }
    public void setKullanici_adi(String kullanici_adi) {
        this.kullanici_adi = kullanici_adi;
    }
    public String getSifre() {
        return sifre;
    }
    public void setSifre(String sifre) {
        this.sifre = sifre;
    }
    public String getYetki() {
        return yetki;
    }
    public void setYetki(String yetki) {
        this.yetki = yetki;
    }
    public personel(String personel_ad, String personel_soyad, String kullanici_adi, String sifre, String yetki) {
        setPersonel_ad(personel_ad);
        setPersonel_soyad(personel_soyad);
        setKullanici_adi(kullanici_adi);
        setSifre(sifre);
        setYetki(yetki);
    }
    
}
