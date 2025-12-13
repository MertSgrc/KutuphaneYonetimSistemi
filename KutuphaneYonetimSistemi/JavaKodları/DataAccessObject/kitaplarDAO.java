package DataAccessObject;

import TableCode.kitaplar;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class kitaplarDAO {

    public void addBook(kitaplar kitap) {
        String sql="INSERT INTO kitaplar (kategori_id, kitap_ad, kitap_yazar, kitap_stok, kitap_durum) VALUES (?,?,?,?,?)";
        try(Connection conn=Database.DataBaseConnection.connect();
            PreparedStatement stmt=conn.prepareStatement(sql)) {
                stmt.setInt(1, kitap.getKategori_id());
                stmt.setString(2, kitap.getKitap_ad());
                stmt.setString(3, kitap.getKitap_yazar());
                stmt.setInt(4, kitap.getKitap_stok());
                stmt.setBoolean(5, kitap.isKitap_durum());
                stmt.executeUpdate();
                System.out.println("Kitap başarıyla eklendi." + kitap.getKitap_ad()); 
            
        } catch (SQLException e) {
            System.out.println("Kitap ekleme hatası: " + e.getMessage());
        }
    }

    public List<kitaplar> getAllBooks() {
        List<kitaplar> bookList = new ArrayList<>();
        String sql = "SELECT * FROM kitaplar";
        try(Connection conn=Database.DataBaseConnection.connect();
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql)) {   
                while (rs.next()) {
                    kitaplar k = new kitaplar(
                        rs.getInt("kategori_id"),
                        rs.getString("kitap_ad"),
                        rs.getString("kitap_yazar"),
                        rs.getInt("kitap_stok"),
                        rs.getBoolean("kitap_durum")
                    );
                    k.setKitap_id(rs.getInt("kitap_id"));
                    bookList.add(k);
               }
        } catch (SQLException e) {
            System.out.println("Kitap listeleme hatası: " + e.getMessage()); 
        }
        return bookList;
    }
    
}
