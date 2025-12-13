package DataAccessObject;


import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.*;
import java.util.List;
import java.util.ArrayList;

import TableCode.uyeler;
import Database.DataBaseConnection;

public class uyelerDAO {
    
    public void addMember(uyeler uye) {
        String sql="INSERT INTO uyeler (uye_ad, uye_soyad, uye_telefon, uye_email, uye_kayıt_tarihi) VALUES (?,?,?,?,?)";  
        try(Connection conn=DataBaseConnection.connect();
            PreparedStatement stmt=conn.prepareStatement(sql)) {
                stmt.setString(1, uye.getUye_ad());
                stmt.setString(2, uye.getUye_soyad());
                stmt.setString(3, uye.getUye_telefon());
                stmt.setString(4, uye.getUye_email());
                stmt.setString(5, uye.getUye_kayit_tarihi().toString());
                stmt.executeUpdate();
                System.out.println("Üye başarıyla eklendi." + uye.getUye_ad()); 
            
        } catch (SQLException e) {
            System.out.println("Kitap ekleme hatası: " + e.getMessage());
        }
    }

    public List<uyeler> getAllMembers() {
        List<uyeler> membersList = new ArrayList<>();
        String sql = "SELECT * FROM uyeler";
        try(Connection conn=DataBaseConnection.connect();
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql)) {   
                while (rs.next()) {
                    uyeler uye = new uyeler(
                        rs.getString("uye_ad"),
                        rs.getString("uye_soyad"),
                        rs.getString("uye_email"),
                        rs.getString("uye_telefon"),
                        rs.getDate("uye_kayıt_tarihi")
                    );
                    uye.setUye_id(rs.getInt("uye_id"));
                    membersList.add(uye);
               }
        } catch (SQLException e) {
            System.out.println("Üye listeleme hatası: " + e.getMessage()); 
        }
        return membersList;
    }      
}
