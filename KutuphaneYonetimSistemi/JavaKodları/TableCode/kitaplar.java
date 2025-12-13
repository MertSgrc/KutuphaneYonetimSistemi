package TableCode;

public class kitaplar {
    private int kitap_id;
    private int kategori_id;
    private String kitap_ad;
    private String kitap_yazar;
    private int kitap_stok;
    private boolean kitap_durum;
    public int getKitap_id() {
        return kitap_id;
    }
    public void setKitap_id(int kitap_id) {
        this.kitap_id = kitap_id;
    }
    public int getKategori_id() {
        return kategori_id;
    }
    public void setKategori_id(int kategori_id) {
        this.kategori_id = kategori_id;
    }
    public String getKitap_ad() {
        return kitap_ad;
    }
    public void setKitap_ad(String kitap_ad) {
        this.kitap_ad = kitap_ad;
    }
    public String getKitap_yazar() {
        return kitap_yazar;
    }
    public void setKitap_yazar(String kitap_yazar) {
        this.kitap_yazar = kitap_yazar;
    }
    public int getKitap_stok() {
        return kitap_stok;
    }
    public void setKitap_stok(int kitap_stok) {
        this.kitap_stok = kitap_stok;
    }
    public boolean isKitap_durum() {
        return kitap_durum;
    }
    public void setKitap_durum(boolean kitap_durum) {
        this.kitap_durum = kitap_durum;
    }
    public kitaplar(int kategori_id, String kitap_ad, String kitap_yazar, int kitap_stok, boolean kitap_durum) {
        setKategori_id(kategori_id);
        setKitap_ad(kitap_ad);
        setKitap_yazar(kitap_yazar);
        setKitap_stok(kitap_stok);
        setKitap_durum(kitap_durum);
    }
    
}
