import { api } from './api.js';

export const reportsModule = {
    async loadPage(container) {
        container.innerHTML = '<h1>Raporlar ve İstatistikler</h1><p>Veriler analiz ediliyor...</p>';

        try {
            // Tüm verileri çekelim
            const [loans, books, members] = await Promise.all([
                api.getLoans(),
                api.getBooks(),
                api.getMembers()
            ]);

            // --- 1. HESAPLAMALAR ---

            // A) Finansal Durum (Toplam Tahsil Edilen Ceza)
            const totalRevenue = loans.reduce((sum, loan) => sum + (loan.ceza_odenen || 0), 0);
            
            // B) Aktif ve Tamamlanan İşlemler
            const activeLoans = loans.filter(l => l.odunc_durum).length;
            const completedLoans = loans.filter(l => !l.odunc_durum).length;

            // C) En Popüler Kitaplar (Top 5)
            const bookCounts = {};
            loans.forEach(l => {
                bookCounts[l.kitap_id] = (bookCounts[l.kitap_id] || 0) + 1;
            });

            const popularBooks = Object.entries(bookCounts)
                .sort((a, b) => b[1] - a[1]) // Çoktan aza sırala
                .slice(0, 5) // İlk 5'i al
                .map(([id, count]) => {
                    const book = books.find(b => b.kitap_id == id);
                    return { 
                        name: book ? book.kitap_ad : 'Silinmiş Kitap', 
                        count: count,
                        percent: (count / loans.length) * 100 // Yüzdelik dilim
                    };
                });

            // D) En Aktif Üyeler (Top 5)
            const memberCounts = {};
            loans.forEach(l => {
                memberCounts[l.uye_id] = (memberCounts[l.uye_id] || 0) + 1;
            });

            const topMembers = Object.entries(memberCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, count]) => {
                    const member = members.find(m => m.uye_id == id);
                    return { 
                        name: member ? `${member.uye_ad} ${member.uye_soyad}` : 'Silinmiş Üye', 
                        count: count 
                    };
                });


            // --- 2. HTML OLUŞTURMA ---

            // Popüler Kitaplar Listesi HTML
            const booksHtml = popularBooks.map(item => `
                <div style="margin-bottom: 15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong>${item.name}</strong>
                        <span>${item.count} kez okundu</span>
                    </div>
                    <div style="background:#e9ecef; height:10px; border-radius:5px; overflow:hidden;">
                        <div style="background:var(--primary-color); width:${item.percent}%; height:100%;"></div>
                    </div>
                </div>
            `).join('');

            // En İyi Üyeler Tablosu HTML
            const membersHtml = topMembers.map((item, index) => `
                <tr>
                    <td>${index + 1}.</td>
                    <td>${item.name}</td>
                    <td style="text-align:right;"><strong>${item.count}</strong> Kitap</td>
                </tr>
            `).join('');


            const content = `
                <h1>Yönetici Raporları</h1>
                
                <div class="card-grid" style="margin-bottom: 30px;">
                    <div class="stat-card" style="border-left: 5px solid #28a745; background:#e8f9ed;">
                        <h3 style="color:#28a745;">Toplam Ciro</h3>
                        <p style="font-size:1.8em; font-weight:bold;">${totalRevenue.toFixed(2)} TL</p>
                        <small>Tahsil edilen gecikme cezaları</small>
                    </div>
                    <div class="stat-card" style="border-left: 5px solid #17a2b8; background:#d1ecf1;">
                        <h3 style="color:#17a2b8;">Toplam İşlem</h3>
                        <p style="font-size:1.8em; font-weight:bold;">${loans.length}</p>
                        <small>Bugüne kadar yapılan ödünç</small>
                    </div>
                    <div class="stat-card" style="border-left: 5px solid #ffc107; background:#fff3cd;">
                        <h3 style="color:#856404;">Aktif Ödünç</h3>
                        <p style="font-size:1.8em; font-weight:bold;">${activeLoans}</p>
                        <small>Şu an üyelerde olan kitaplar</small>
                    </div>
                    <div class="stat-card" style="border-left: 5px solid #6c757d; background:#e2e3e5;">
                        <h3 style="color:#383d41;">İade Edilen</h3>
                        <p style="font-size:1.8em; font-weight:bold;">${completedLoans}</p>
                        <small>Başarıyla tamamlanan</small>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    
                    <div class="card">
                        <h3 style="color:var(--primary-color); border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:20px;">
                            <i class="fas fa-book-reader"></i> En Çok Okunan Kitaplar
                        </h3>
                        ${popularBooks.length > 0 ? booksHtml : '<p>Henüz veri yok.</p>'}
                    </div>

                    <div class="card">
                        <h3 style="color:var(--accent-color); border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:20px;">
                            <i class="fas fa-medal"></i> Ayın Kitap Kurtları
                        </h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th width="50">#</th>
                                    <th>Üye Adı</th>
                                    <th style="text-align:right;">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topMembers.length > 0 ? membersHtml : '<tr><td colspan="3">Henüz veri yok.</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                </div>
            `;

            container.innerHTML = content;

        } catch (error) {
            container.innerHTML = `<div class="alert error">Rapor yüklenirken hata: ${error.message}</div>`;
        }
    }
};