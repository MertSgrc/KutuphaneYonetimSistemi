package service;

import DataAccessObject.*;
import TableCode.*;

public class LibraryService {
    private uyelerDAO uyeDAO = new uyelerDAO();
    private personelDAO personelDAO = new personelDAO();
    private oduncDAO oduncDAO = new oduncDAO();
    private kategorilerDAO kategoriDAO = new kategorilerDAO();
    private kitaplarDAO kitapDAO = new kitaplarDAO();

    public void addMember(String ad, String soyad, String telefon, String email, java.sql.Date kayitTarihi) {
        uyeler uye = new uyeler(ad, soyad, telefon, email, kayitTarihi);
        uyeDAO.addMember(uye);
    }

    public void addPersonel(String ad, String soyad, String kullaniciAdi, String sifre, String yetki) {
        personel p = new personel(ad, soyad, kullaniciAdi, sifre, yetki);
        personelDAO.addPersonel(p);
    }

    public void addOdunc(int uye_id, int kitap_id, String odunc_tarih, String iade_tarih, boolean odunc_durum) {
        odunc o = new odunc(uye_id, kitap_id, odunc_tarih, iade_tarih, odunc_durum);
        oduncDAO.addOdunc(o);
    }

    public void addKategori(String kategoriAd) {
    kategoriler kategori = new kategoriler(kategoriAd);
    kategoriDAO.addKategori(kategori);
}
    public void addBook(int kategoriId, String kitapAd, String kitapYazar, int kitapStok, boolean kitapDurum) {
        kitaplar kitap = new kitaplar(kategoriId, kitapAd, kitapYazar, kitapStok, kitapDurum);
        kitapDAO.addBook(kitap);
    }

    
    

    
}
