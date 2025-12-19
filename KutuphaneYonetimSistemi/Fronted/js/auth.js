import { api } from './api.js';
import { router } from './routing.js';

let userSession = null;

export const auth = {
    // Oturum Kontrolü (Sayfa yenilenince çalışır)
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

    // Mevcut Kullanıcı Bilgisi (Diğer dosyalardan çağrılır)
    getUser() {
        return userSession;
    },

    // Giriş İşlemi
    login: async (username, password) => {
        try {
            // api.js üzerinden Java Backend'e istek at
            const userData = await api.login(username, password);
            
            // Backend'den başarılı cevap geldiyse (userData bir obje ve id'si varsa)
            if (userData && userData.id) {
                userSession = userData;
                localStorage.setItem('kys_user_session', JSON.stringify(userData));
                
                // Ekranları değiştir (Giriş -> Dashboard)
                const authContainer = document.getElementById('auth-container');
                const dashboardScreen = document.getElementById('dashboard-screen');
                
                if (authContainer) authContainer.classList.add('hidden');
                if (dashboardScreen) dashboardScreen.style.display = 'flex';
                
                // Rol göstergesi varsa güncelle
                const roleDisplay = document.getElementById('user-role-display');
                if(roleDisplay) roleDisplay.innerText = userData.yetki || userData.roleType;

                // Anasayfaya yönlendir
                router.navigate('home');
                return true;
            } else {
                // Başarısız Giriş
                return false; 
            }
        } catch (error) {
            throw error;
        }
    },

    // Çıkış İşlemi
    logout: () => {
        userSession = null;
        localStorage.removeItem('kys_user_session');
        localStorage.removeItem('last_route'); // Son kalınan sayfayı da unut
        window.location.reload(); // Sayfayı yenileyerek temiz başlangıç yap
    }
};