import { auth } from './auth.js';
import { api } from './api.js';
import { memberModule } from './members.js';
import { booksModule } from './books.js';
import { loansModule } from './loans.js';
import { categoriesModule } from './categories.js';
import { staffModule } from './staff.js';
import { reportsModule } from './reports.js';
import { finesModule } from './fines.js';
import { profileModule } from './profile.js';

const mainContent = document.getElementById('main-content');
const navLinks = document.querySelectorAll('.sidebar a[data-route]');

// --- YARDIMCI FONKSİYON: Sayfa Render Etme ---
const renderDefaultPage = (title, content) => {
    mainContent.innerHTML = `
        <h1>${title}</h1>
        <div class="card">
            ${content}
        </div>
    `;
};

// --- YARDIMCI FONKSİYON: Menü Gizleme/Gösterme ---
const updateSidebarVisibility = () => {
    const user = auth.getUser();
    if (!user) return;

    const role = user.yetki; // 'Yonetici', 'Personel' veya 'Uye'
    
    // Rol ismini logoya yazalım (varsa)
    const roleDisplay = document.getElementById('user-role-display');
    if(roleDisplay) roleDisplay.textContent = role;

    // Tüm özel linkleri gizle
    document.querySelectorAll('.role-admin, .role-staff').forEach(el => el.style.display = 'none');

    if (role === 'Yonetici') {
        // Yönetici hepsini görür
        document.querySelectorAll('.role-admin, .role-staff').forEach(el => el.style.display = 'flex');
    } else if (role === 'Personel') {
        // Personel sadece staff class'lı olanları görür
        document.querySelectorAll('.role-staff').forEach(el => el.style.display = 'flex');
    } 
    // Üye ise hiçbirini görmez, sadece genel linkler kalır.
};

// --- ANASAYFA İÇERİĞİ ---
const renderHomePage = async () => {
    const user = auth.getUser();
    
    // 1. Üye Girişi İse: Basit Karşılama Ekranı
    if (user.yetki === 'Uye') {
        renderDefaultPage("Hoş Geldiniz", `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: var(--accent-color);">Merhaba, ${user.ad}!</h2>
                <p style="margin-top: 15px; font-size: 1.1em;">Kütüphanemize hoş geldin.</p>
                <p>Sol menüden <strong>Kitaplar</strong> sekmesine tıklayarak kütüphanemizdeki eserleri inceleyebilirsin.</p>
                <div style="margin-top: 30px; padding: 15px; background-color: #e8f9ed; border-radius: 5px; display: inline-block;">
                    <i class="fas fa-info-circle" style="color: var(--success-color);"></i>
                    Ödünç aldığın kitapları iade etmek veya yeni kitap almak için lütfen kütüphane görevlisi ile iletişime geç.
                </div>
            </div>
        `);
        return;
    }

    // 2. Personel veya Yönetici İse: İstatistik Paneli (Dashboard)
    try {
        // Verileri çek
        const [loans, members, books] = await Promise.all([
            api.getLoans(),
            api.getMembers(),
            api.getBooks()
        ]);

        const activeLoans = loans.filter(o => o.odunc_durum).length;
        const overdueLoans = loans.filter(o => o.odunc_durum && o.ceza > 0).length;

        const content = `
            <p style="margin-bottom: 20px;">Yönetim paneline hoş geldiniz. İşte güncel durum:</p>
            <div class="card-grid">
                <div class="stat-card">
                    <h3>Toplam Kitap</h3>
                    <p>${books.length}</p>
                </div>
                <div class="stat-card" style="background-color: var(--info-color);">
                    <h3>Toplam Üye</h3>
                    <p>${members.length}</p>
                </div>
                <div class="stat-card" style="background-color: var(--accent-color);">
                    <h3>Ödünçteki Kitaplar</h3>
                    <p>${activeLoans}</p>
                </div>
                <div class="stat-card" style="background-color: ${overdueLoans > 0 ? 'var(--danger-color)' : '#95a5a6'};">
                    <h3>Gecikmiş İadeler</h3>
                    <p>${overdueLoans}</p>
                </div>
            </div>
        `;

        renderDefaultPage("Yönetim Paneli", content);

    } catch (error) {
        renderDefaultPage("Hata", `<p class="alert error">Veriler yüklenirken bir sorun oluştu: ${error.message}</p>`);
    }
};

// --- ROTA TANIMLARI ---
const routes = {
    'home': renderHomePage,
    'members': memberModule.loadPage,
    'books': booksModule.loadPage,
    'loans': loansModule.loadPage,
    'profile': profileModule.loadPage,
    'fines': finesModule.loadPage, 
    'categories': categoriesModule.loadPage,
    'staff': staffModule.loadPage,
    'reports': reportsModule.loadPage,
};

// --- ROUTER NESNESİ ---
export const router = {
    navigate(route) {
        // Oturum kontrolü
        if (!auth.checkSession()) return;
        
        // Sidebar'ı güncelle
        updateSidebarVisibility();

        // Yetki Kontrolü (Üyeler yasaklı sayfalara giremesin)
        const user = auth.getUser();
            if (user.yetki === 'Uye' && ['members', 'loans', 'fines', 'categories', 'staff', 'reports'].includes(route)) {
            renderDefaultPage("Yetkisiz Erişim", `<p class="alert error">Bu sayfayı görüntüleme yetkiniz yok.</p>`);
            return;
        }

        // Aktif menü linkini işaretle
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.route === route) link.classList.add('active');
        });

        // İlgili sayfayı yükle
        const routeHandler = routes[route];
        if (routeHandler) {
            routeHandler(mainContent);
            // Son gidilen rotayı kaydet (Sayfa yenilenince orada kalmak için)
            localStorage.setItem('last_route', route);
        } else {
            router.navigate('home');
        }
    }
};