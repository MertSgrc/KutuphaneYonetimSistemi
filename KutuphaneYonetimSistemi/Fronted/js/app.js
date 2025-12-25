import { auth } from './auth.js';
import { api } from './api.js';
import { router } from './routing.js';

// --- PROFESYONEL BİLDİRİM SİSTEMİ (TOAST) ---
export const showToast = (message, type = 'info') => {
    const container = document.getElementById('notification-area');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
               type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
               '<i class="fas fa-info-circle"></i>';
               
    toast.innerHTML = `<span style="margin-right:10px">${icon}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
};

document.addEventListener('DOMContentLoaded', () => {

    localStorage.clear();

    if (!auth.checkSession()) {
        document.body.classList.add('login-mode');
    } else {
        document.body.classList.remove('login-mode');
    }
    
    // --- EKRAN GEÇİŞLERİ ---
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const authContainer = document.getElementById('auth-container');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    // Kaydol ekranına geçiş
    document.getElementById('go-to-register')?.addEventListener('click', () => {
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
    });
    
    // Giriş ekranına geçiş
    document.getElementById('go-to-login')?.addEventListener('click', () => {
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });

    // --- GİRİŞ İŞLEMİ ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // DÜZELTİLEN KISIM: ID'ler HTML ile eşleşti
            const uInput = document.getElementById('login-username');
            const pInput = document.getElementById('login-password');
            
            // Hata kontrolü: Eğer element bulunamazsa işlemi durdur
            if (!uInput || !pInput) {
                console.error("HATA: login-username veya login-password ID'li element HTML'de bulunamadı!");
                showToast("Sistem hatası: Form elementleri bulunamadı.", "error");
                return;
            }

            const u = uInput.value;
            const p = pInput.value;
            
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;
            btn.textContent = 'Giriş Yapılıyor...';
            btn.disabled = true;

            try {
                const success = await auth.login(u, p);
                
                if (success) {
                    showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');

                    document.body.classList.remove('login-mode'); 
                    
                } else {
                    throw new Error("Kullanıcı adı veya şifre hatalı!");
                }
            } catch (err) {
                console.error(err);
                showToast(err.message || 'Giriş başarısız.', 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- KAYDOLMA İŞLEMİ (ÜYE) ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            // Butonu kilitle
            const btn = registerForm.querySelector('button');
            const originalText = btn.innerText;
            btn.textContent = 'İşleniyor...';
            btn.disabled = true;

            try {
                // 1. Kayıt İsteği Gönder (Mail gider)
                await api.registerMember(data);
                
                // 2. Başarılıysa Kod Doğrulama Penceresini Aç
                const { value: code } = await Swal.fire({
                    title: 'Doğrulama Kodu',
                    input: 'text',
                    inputLabel: `Lütfen ${data.uye_email} adresine gönderilen 6 haneli kodu giriniz.`,
                    inputPlaceholder: '123456',
                    showCancelButton: false,
                    allowOutsideClick: false,
                    confirmButtonText: 'Doğrula',
                    inputValidator: (value) => {
                        if (!value) return 'Kodu girmelisiniz!';
                    }
                });

                if (code) {
                    // 3. Kodu Doğrula
                    await api.verifyEmail(data.uye_email, code);
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Tebrikler!',
                        text: 'Hesabınız doğrulandı. Şimdi giriş yapabilirsiniz.',
                        confirmButtonText: 'Girişe Git'
                    }).then(() => {
                        registerForm.reset();
                        document.getElementById('register-box').classList.add('hidden');
                        document.getElementById('login-box').classList.remove('hidden');
                    });
                }

            } catch (err) {
                Swal.fire('Hata', err.message, 'error');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- ÇIKIŞ ---
    document.getElementById('logout-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('login-mode');
        auth.logout();
    });
    
    // --- SAYFA YÖNLENDİRME ---
    if (auth.checkSession()) {
        if(authContainer) authContainer.classList.add('hidden');
        if(dashboardScreen) dashboardScreen.style.display = 'flex';
        
        // Son kalınan sayfa veya home
        const currentRoute = localStorage.getItem('last_route') || 'home';
        router.navigate(currentRoute);
    } else {
        if(authContainer) authContainer.classList.remove('hidden');
        if(dashboardScreen) dashboardScreen.style.display = 'none';
    }

    // --- SIDEBAR TIKLAMALARI ---
    document.querySelectorAll('.sidebar a[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.target.closest('a').dataset.route; 
            router.navigate(route);
        });
    });
});