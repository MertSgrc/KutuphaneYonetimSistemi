package Database;

import java.sql.Connection;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;
import java.sql.DriverManager;
import java.sql.SQLException;


public class DataBaseConnection {
    public static Connection connect() {
        Properties props = new Properties();

        try(FileInputStream fis=new FileInputStream("config.properties")) {
            props.load(fis);
            String url = props.getProperty("db.url");
            String user = props.getProperty("db.user");
            String password = props.getProperty("db.password");

            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("MySQL Bağlantısı Başarılı");
            return conn;
        } catch (IOException e) {
           System.out.println("Dosya okuma hatası: " + e.getMessage());
        }
        catch (SQLException e) {
            System.out.println("Veritabanı bağlantı hatası: " + e.getMessage());
        }
        
        return null; 
    }
    public static void main(String[] args) {
        connect();
    }
    
}
