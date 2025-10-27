import java.io.FileInputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DBConnection {

    public static Connection connect() {
        Properties props = new Properties();

        try (FileInputStream fis = new FileInputStream("config.properties")) {
            props.load(fis);

            String url = props.getProperty("db.url");
            String user = props.getProperty("db.user");
            String password = props.getProperty("db.password");

            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("MySQL bağlantısı başarılı!");
            return conn;
        } catch (IOException e) {
            System.out.println("Dosya okunamadı: " + e.getMessage());
        } catch (SQLException e) {
            System.out.println("Veritabanı hatası: " + e.getMessage());
        }

        return null;
    }

    public static void main(String[] args) {
        connect();
    }
}
