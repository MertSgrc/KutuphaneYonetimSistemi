import { api } from './api.js';
import { attachLoanListeners } from './loans.js';

export const finesModule = {
    async loadPage(container) {
        container.innerHTML = '<h1>Gecikmiş Kitaplar ve Cezalar</h1><p>Yükleniyor...</p>';

        try {
            // 1. Tüm ödünçleri çek
            const loans = await api.getLoans(); 

            // 2. Gecikenleri Filtrele
            const today = new Date();
            today.setHours(0, 0, 0, 0); 

            const overdueLoans = loans.filter(loan => {
                // Tarih formatını kontrol et ve çevir
                const tarihString = loan.odunc_iade_tarihi || loan.iade_tarihi;
                const iadeTarihi = new Date(tarihString);

                // Kural: Kitap hala üyedeyse (odunc_durum: true) VE tarihi geçmişse
                return loan.odunc_durum === true && iadeTarihi < today;
            });

            if (overdueLoans.length === 0) {
                container.innerHTML = `
                    <h1>Gecikmiş Kitaplar ve Cezalar</h1>
                    <div style="padding: 20px; background-color: #d4edda; color: #155724; border-radius: 5px; margin-top:20px;">
                        <i class="fas fa-check-circle"></i> Harika! Şu an gecikmiş kitap veya ödenmemiş ceza bulunmuyor.
                    </div>`;
                return;
            }

            // 3. Tabloyu oluştur
            const rows = overdueLoans.map(loan => {
                const tarihString = loan.odunc_iade_tarihi || loan.iade_tarihi;
                const iadeTarihi = new Date(tarihString);
                
                // Gecikilen gün sayısını bul
                const diffTime = Math.abs(today - iadeTarihi);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                // --- DEĞİŞİKLİK BURADA: Günlük Ceza 5 TL ---
                const gunlukCeza = 5; 
                const toplamCeza = diffDays * gunlukCeza;
                // -------------------------------------------

                return `
                    <tr style="background-color: #fff3cd;">
                        <td>${loan.odunc_id}</td>
                        <td>${loan.uye_ad_soyad || loan.uye_ad + ' ' + loan.uye_soyad || 'Üye'}</td>
                        <td>${loan.kitap_ad || 'Kitap'}</td>
                        <td>${tarihString}</td>
                        <td style="color:red; font-weight:bold;">${diffDays} Gün</td>
                        <td style="font-weight:bold;">${toplamCeza.toFixed(2)} TL</td>
                        <td>
                            <button class="btn btn-warning btn-pay-fine" 
                                data-id="${loan.odunc_id}" 
                                data-ceza="${toplamCeza.toFixed(2)}">
                                <i class="fas fa-coins"></i> Öde & İade Al
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            container.innerHTML = `
                <h1>Gecikmiş İadeler ve Cezalar</h1>
                <div class="alert info" style="margin-bottom: 20px;">
                    <i class="fas fa-info-circle"></i> Not: Gecikme cezası günlük <strong>5.00 TL</strong> üzerinden hesaplanmaktadır.
                </div>
                <div class="card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th><th>Üye</th><th>Kitap</th><th>İade Tarihi</th><th>Gecikme</th><th>Ceza</th><th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;

            attachLoanListeners(container);

        } catch (error) {
            container.innerHTML = `<div class="alert error">Hata: ${error.message}</div>`;
        }
    }
};