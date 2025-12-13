package DataAccessObject;

import TableCode.personel;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class personelDAO {

    public void addPersonel(personel p) {
        String sql="INSERT INTO personel (personel_ad, personel_soyad, kullanici_adi, sifre, yetki) VALUES (?,?,?,?,?)";
        try(Connection conn=Database.DataBaseConnection.connect();
            PreparedStatement stmt=conn.prepareStatement(sql)) {
                stmt.setString(1, p.getPersonel_ad());
                stmt.setString(2, p.getPersonel_soyad());
                stmt.setString(3, p.getKullanici_adi());
                stmt.setString(4, p.getSifre());
                stmt.setString(5, p.getYetki());
                stmt.executeUpdate();
                System.out.println("Personel başarıyla eklendi." + p.getPersonel_ad()); 
            
        } catch (SQLException e) {
            System.out.println("Personel ekleme hatası: " + e.getMessage());
        }
    }

    public List<personel> getAllPersonel() {
        List<personel> personelList = new ArrayList<>();
        String sql = "SELECT * FROM personel";
        try(Connection conn=Database.DataBaseConnection.connect();
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql)) {   
                while (rs.next()) {
                    personel p = new personel(
                        rs.getString("personel_ad"),
                        rs.getString("personel_soyad"),
                        rs.getString("kullanici_adi"),
                        rs.getString("sifre"),
                        rs.getString("yetki")
                    );
                    p.setPersonel_id(rs.getInt("personel_id"));
                    personelList.add(p);
               }
        } catch (SQLException e) {
            System.out.println("Personel listeleme hatası: " + e.getMessage()); 
        }
        return personelList;
    }


    


    
}
