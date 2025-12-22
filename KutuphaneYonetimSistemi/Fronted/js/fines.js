import { api } from './api.js';
import { attachLoanListeners } from './loans.js';

export const finesModule = {
    async loadPage(container) {
        container.innerHTML = '<h1>Gecikmiş Kitaplar ve Cezalar</h1><p>Yükleniyor...</p>';

        try {
            // 1. Verileri Çek (Ödünçler, Üyeler ve Kitaplar)
            const [loans, members, books] = await Promise.all([
                api.getLoans(),
                api.getMembers(),
                api.getBooks()
            ]);

            // 2. Gecikenleri Filtrele
            const today = new Date();
            today.setHours(0, 0, 0, 0); 

            const overdueLoans = loans.filter(loan => {
                const tarihString = loan.iade_tarihi;
                
                if(!tarihString) return false;
                
                const iadeTarihi = new Date(tarihString);
                const isActive = loan.durum !== 'İade Edildi' && loan.durum !== 'Pasif';
                
                return isActive && iadeTarihi < today;
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
                const oId = loan.odunc_id;
                const tarihString = loan.iade_tarihi;
                const iadeTarihi = new Date(tarihString);
                
                // Ceza Hesabı
                const diffTime = Math.abs(today - iadeTarihi);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                const toplamCeza = diffDays * 5; // 5 TL/Gün

                // İsimleri Eşleştirme (Mapping)
                const uId = loan.uye_id;
                const member = members.find(m => m.uye_id === uId);
                const memberName = member ? `${member.uye_ad} ${member.uye_soyad}` : `Üye ID: ${uId}`;

                const kId = loan.ktp_id; 
                const book = books.find(b => b.ktpId === kId);
                const bookName = book ? book.ktpAd : `Kitap ID: ${kId}`;

                return `
                    <tr style="background-color: #fff3cd;">
                        <td>${oId}</td>
                        <td>${memberName}</td>
                        <td>${bookName}</td>
                        <td>${tarihString}</td>
                        <td style="color:red; font-weight:bold;">${diffDays} Gün</td>
                        <td style="font-weight:bold;">${toplamCeza.toFixed(2)} TL</td>
                        <td>
                            <button class="btn btn-warning btn-pay-fine" 
                                data-id="${oId}" 
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