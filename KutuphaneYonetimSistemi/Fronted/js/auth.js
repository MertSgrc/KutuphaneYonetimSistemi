import { api } from './api.js';
import { router } from './routing.js';

let userSession = null;

export const auth = {
    // Oturum Kontrolü
    checkSession() {
        try {
            const storedSession = localStorage.getItem('kys_user_session');
            if (storedSession) {
                userSession = JSON.parse(storedSession);
                return true;
            }
        } catch (e) {
            console.error("Oturum okuma hatası", e);
            localStorage.removeItem('kys_user_session');
        }
        return false;
    },

    // Mevcut Kullanıcı Bilgisi
    getUser() {
        return userSession;
    },

    // Giriş İşlemi
    login: async (username, password) => {
        try {
            const userData = await api.login(username, password);
            
            // Başarılı Giriş
            if (userData && userData.id) {
                userSession = userData;
                localStorage.setItem('kys_user_session', JSON.stringify(userData));
                
                // Ekranları değiştir (Hata önleyici kontrollerle)
                const authContainer = document.getElementById('auth-container');
                const dashboardScreen = document.getElementById('dashboard-screen');
                
                if (authContainer) authContainer.classList.add('hidden');
                if (dashboardScreen) dashboardScreen.style.display = 'flex';
                
                // Anasayfaya yönlendir
                router.navigate('home');
                return true;
            } else {
                // Başarısız Giriş (api.login false döndü)
                return false; 
            }
        } catch (error) {
            // Bir hata olursa fırlat (app.js bunu yakalayıp ekrana basacak)
            throw error;
        }
    },

    // Çıkış İşlemi
    logout: () => {
        userSession = null;
        localStorage.removeItem('kys_user_session');
        window.location.reload(); // En temiz çıkış: Sayfayı yenile
    }
};