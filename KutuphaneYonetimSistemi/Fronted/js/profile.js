import { api } from './api.js';
import { auth } from './auth.js';

export const profileModule = {
    async loadPage(container) {
        const user = auth.getUser();
        if (!user) return; // Güvenlik kontrolü

        container.innerHTML = '<h1>Profilim ve Geçmişim</h1><p>Veriler yükleniyor...</p>';

        try {
            // 1. Kitapları ve Ödünçleri Çek
            const [loans, books] = await Promise.all([
                api.getLoans(),
                api.getBooks()
            ]);

            // 2. Sadece BU ÜYEYE ait kayıtları filtrele
            // Not: user.id veya user.uye_id hangisi kayıtlıysa onu kullanıyoruz.
            const myLoans = loans.filter(l => l.uye_id === (user.uye_id || user.id));

            // 3. İstatistikleri Hesapla
            const activeLoansCount = myLoans.filter(l => l.odunc_durum).length;
            
            // Toplam Ceza/Borç Hesaplama
            let totalDebt = 0;
            const today = new Date();
            today.setHours(0,0,0,0);

            // Bakiyeyi simüle edelim (Gerçekte veritabanından gelir)
            // Eğer user objesinde bakiye yoksa rastgele 100 TL verelim veya 0 diyelim.
            const userBalance = user.bakiye !== undefined ? user.bakiye : 100.00; 

            const historyRows = myLoans.map(loan => {
                const book = books.find(b => b.kitap_id === loan.kitap_id);
                const bookName = book ? book.kitap_ad : 'Bilinmiyor';
                
                const dueDate = new Date(loan.odunc_iade_tarihi || loan.iade_tarihi);
                const returnDate = loan.odeme_tarihi ? new Date(loan.odeme_tarihi) : null;
                
                let statusBadge = '';
                let rowClass = '';
                let debtAmount = 0;

                // --- DURUM ANALİZİ ---
                if (loan.odunc_durum) {
                    // AKTİF (Hala elinde)
                    if (dueDate < today) {
                        // GECİKMİŞ
                        const diffTime = Math.abs(today - dueDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        debtAmount = diffDays * 5; // Günlük 5 TL
                        totalDebt += debtAmount;
                        
                        statusBadge = `<span class="badge" style="background:var(--danger-color); color:white;">GECİKTİ (${diffDays} Gün)</span>`;
                        rowClass = 'background-color: #fff3cd;'; // Sarımsı arka plan
                    } else {
                        // ZAMANINDA (Okuyor)
                        statusBadge = `<span class="badge" style="background:var(--info-color); color:white;">Okunuyor</span>`;
                    }
                } else {
                    // İADE EDİLMİŞ (Geçmiş)
                    if (loan.odeme_yapildi) {
                        statusBadge = `<span class="badge" style="background:var(--success-color); color:white;">İade Edildi & Ödendi</span>`;
                    } else {
                        statusBadge = `<span class="badge" style="background:#6c757d; color:white;">İade Edildi</span>`;
                    }
                }

                return `
                    <tr style="${rowClass}">
                        <td>${bookName}</td>
                        <td>${loan.odunc_alma_tarihi}</td>
                        <td>${loan.odunc_iade_tarihi || loan.iade_tarihi}</td>
                        <td>${loan.odeme_tarihi || '-'}</td>
                        <td>${debtAmount > 0 ? `<b style="color:red">${debtAmount.toFixed(2)} TL</b>` : '-'}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            }).reverse().join(''); // En son işlem en üstte görünsün diye reverse()

            // 4. HTML'i Oluştur
            const content = `
                <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    
                    <div class="stat-card" style="background: #f8f9fa; border-left: 5px solid var(--primary-color);">
                        <h3 style="color:#333;">Sayın ${user.ad || 'Üye'}</h3>
                        <p style="font-size: 0.9em; color:#666;">Kütüphane Üyesi</p>
                    </div>

                    <div class="stat-card" style="background: #e8f9ed; border-left: 5px solid var(--success-color);">
                        <h3 style="color: var(--success-color);">Cüzdan Bakiyem</h3>
                        <p style="font-size: 1.5em; font-weight:bold;">${userBalance.toFixed(2)} TL</p>
                    </div>

                    <div class="stat-card" style="background: #fff3cd; border-left: 5px solid var(--warning-color);">
                        <h3 style="color: #856404;">Güncel Borcum</h3>
                        <p style="font-size: 1.5em; font-weight:bold; color:${totalDebt > 0 ? 'red' : 'green'}">
                            ${totalDebt.toFixed(2)} TL
                        </p>
                    </div>

                    <div class="stat-card" style="background: #d1ecf1; border-left: 5px solid var(--info-color);">
                        <h3 style="color: #0c5460;">Okuduğum Kitaplar</h3>
                        <p style="font-size: 1.5em; font-weight:bold;">${myLoans.length}</p>
                    </div>
                </div>

                <div class="card">
                    <h2 style="margin-bottom:15px; color:var(--primary-color);">Kitap Geçmişim</h2>
                    ${myLoans.length > 0 ? `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Kitap Adı</th>
                                    <th>Alış Tarihi</th>
                                    <th>Son Teslim T.</th>
                                    <th>İade Ettiğim T.</th>
                                    <th>Ceza</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>${historyRows}</tbody>
                        </table>
                    ` : '<p class="alert info">Henüz kütüphanemizden kitap almadınız.</p>'}
                </div>
            `;

            container.innerHTML = content;

        } catch (error) {
            container.innerHTML = `<div class="alert error">Profil yüklenirken hata: ${error.message}</div>`;
        }
    }
};