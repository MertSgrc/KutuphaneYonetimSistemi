package TableCode;

public class odunc {
    private int odunc_id;
    private int uye_id;
    private int kitap_id;
    private String odunc_tarih;
    private String iade_tarih;
    private boolean odunc_durum;
    public int getOdunc_id() {
        return odunc_id;
    }
    public void setOdunc_id(int odunc_id) {
        this.odunc_id = odunc_id;
    }
    public int getUye_id() {
        return uye_id;
    }
    public void setUye_id(int uye_id) {
        this.uye_id = uye_id;
    }
    public int getKitap_id() {
        return kitap_id;
    }
    public void setKitap_id(int kitap_id) {
        this.kitap_id = kitap_id;
    }
    public String getOdunc_tarih() {
        return odunc_tarih;
    }
    public void setOdunc_tarih(String odunc_tarih) {
        this.odunc_tarih = odunc_tarih;
    }
    public String getIade_tarih() {
        return iade_tarih;
    }
    public void setIade_tarih(String iade_tarih) {
        this.iade_tarih = iade_tarih;
    }
    public boolean isOdunc_durum() {
        return odunc_durum;
    }
    public void setOdunc_durum(boolean odunc_durum) {
        this.odunc_durum = odunc_durum;
    }
    public odunc(int uye_id, int kitap_id, String odunc_tarih, String iade_tarih, boolean odunc_durum) {
        setUye_id(uye_id);
        setKitap_id(kitap_id);
        setOdunc_tarih(odunc_tarih);
        setIade_tarih(iade_tarih);
        setOdunc_durum(odunc_durum);
    }
    
}
