package DataAccessObject;

import TableCode.kategoriler;
import java.sql.*;
import java.util.List;
import java.util.ArrayList;

public class kategorilerDAO {

    public void addKategori(kategoriler kategori) {
        String sql="INSERT INTO kategoriler (kategori_ad) VALUES (?)";  
        try(Connection conn=Database.DataBaseConnection.connect();
            PreparedStatement stmt=conn.prepareStatement(sql)) {
                stmt.setString(1, kategori.getKategori_ad());
                stmt.executeUpdate();
                System.out.println("Kategori başarıyla eklendi." + kategori.getKategori_ad()); 
            
        } catch (SQLException e) {
            System.out.println("Kategori ekleme hatası: " + e.getMessage());
        }
    }

    public List<kategoriler> getAllKategoriler() {
        List<kategoriler> kategoriList = new ArrayList<>();
        String sql = "SELECT * FROM kategoriler";
        try(Connection conn=Database.DataBaseConnection.connect();
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql)) {   
                while (rs.next()) {
                    kategoriler k = new kategoriler(
                        rs.getString("kategori_ad")
                    );
                    k.setKategori_id(rs.getInt("kategori_id"));
                    kategoriList.add(k);
               }
        } catch (SQLException e) {
            System.out.println("Kategori listeleme hatası: " + e.getMessage()); 
        }
        return kategoriList;
    }
    
}
