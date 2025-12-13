package DataAccessObject;

import TableCode.odunc;
import java.sql.*;
import java.util.List;
import java.util.ArrayList;

public class oduncDAO {
    
    public void addOdunc(odunc oduncalma) {
        String sql="INSERT INTO odunc (uye_id, kitap_id, odunc_alma_tarihi, odunc_iade_tarihi, odunc_durum) VALUES (?,?,?,?,?)";
        try(Connection conn=Database.DataBaseConnection.connect();
            PreparedStatement stmt=conn.prepareStatement(sql)) {
                stmt.setInt(1, oduncalma.getUye_id());
                stmt.setInt(2, oduncalma.getKitap_id());
                stmt.setString(3, oduncalma.getOdunc_tarih());
                stmt.setString(4, oduncalma.getIade_tarih());
                stmt.setBoolean(5, oduncalma.isOdunc_durum());
                stmt.executeUpdate();
                System.out.println("Ödünç alma işlemi başarıyla eklendi." + oduncalma.getOdunc_id()); 
            
        } catch (SQLException e) {
            System.out.println("Ödünç alma ekleme hatası: " + e.getMessage());
        }
    }

    public List<odunc> getAllOdunc() {
        List<odunc> oduncList = new ArrayList<>();
        String sql = "SELECT * FROM odunc";
        try(Connection conn=Database.DataBaseConnection.connect();
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql)) {   
                while (rs.next()) {
                    odunc o = new odunc(
                        rs.getInt("uye_id"),
                        rs.getInt("kitap_id"),
                        rs.getString("odunc_alma_tarihi"),
                        rs.getString("odunc_iade_tarihi"),
                        rs.getBoolean("odunc_durum")
                    );
                    o.setOdunc_id(rs.getInt("odunc_id"));
                    oduncList.add(o);
               }
        } catch (SQLException e) {
            System.out.println("Ödünç listeleme hatası: " + e.getMessage()); 
        }
        return oduncList;
    }
}
