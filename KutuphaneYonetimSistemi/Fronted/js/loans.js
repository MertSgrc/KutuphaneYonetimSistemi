import { api } from './api.js';

const renderLoanForm = (members, books) => {
    const memberOptions = members.map(m => `<option value="${m.uye_id}">${m.uye_id} - ${m.uye_ad} ${m.uye_soyad}</option>`).join('');
    // Sadece stokta olan kitapları göster
    const bookOptions = books
        .filter(b => b.kitap_stok > 0)
        .map(b => `<option value="${b.kitap_id}">${b.kitap_ad} (${b.kitap_stok} adet)</option>`).join('');

    return `
        <div class="card">
            <h2 style="color: var(--accent-color); margin-bottom: 20px;">Yeni Ödünç Verme İşlemi</h2>
            <form id="add-loan-form">
                <div class="form-group">
                    <label>Üye Seçimi</label>
                    <select name="uye_id" required>
                        <option value="">Üye Seçiniz</option>
                        ${memberOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Kitap Seçimi (Stoktaki)</label>
                    <select name="kitap_id" required>
                        <option value="">Kitap Seçiniz</option>
                        ${bookOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="odunc_tarihi">Ödünç Verme Tarihi:</label>
                    <input type="date" id="odunc_tarihi" name="odunc_tarihi" class="form-control" required>
                </div>

                <div class="form-group">
                    <label for="iade_tarihi">İade Edilmesi Gereken Tarih:</label>
                    <input type="date" id="iade_tarihi" name="iade_tarihi" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">Ödünç Ver</button>
            </form>
        </div>
    `;
};

const renderLoansList = (loans, members, books) => {
    if (loans.length === 0) return '<p class="alert info">Henüz ödünç işlemi yapılmamıştır.</p>';

    const rows = loans.map(loan => {
        const memberName = members.find(m => m.uye_id === loan.uye_id)?.uye_ad + " " + members.find(m => m.uye_id === loan.uye_id)?.uye_soyad || 'Bilinmiyor';
        const bookName = books.find(b => b.kitap_id === loan.kitap_id)?.kitap_ad || 'Bilinmiyor';

        // Gecikme Hesaplama
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const iadeTarihi = new Date(loan.odunc_iade_tarihi || loan.iade_tarihi);
        
        let calculatedFine = 0;
        let isOverdue = false;

        // Kitap hala üyedeyse ve günü geçmişse hesapla
        if (loan.odunc_durum && iadeTarihi < today) {
            const diffTime = Math.abs(today - iadeTarihi);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            calculatedFine = diffDays * 5; // Günlük 5 TL
            isOverdue = true;
        }

        let statusHtml;
        let actionButton;

        if (!loan.odunc_durum) {
            // --- DURUM 1: KİTAP İADE EDİLMİŞ ---
            
            // Eğer ödeme yapılarak iade edildiyse (Flag kontrolü)
            if (loan.odeme_yapildi) {
                statusHtml = `<span class="badge" style="background-color:#28a745; color:white; padding:5px 10px; border-radius:15px;">
                                <i class="fas fa-check-circle"></i> Ödeme Alındı, İade Edildi
                              </span>`;
            } else {
                // Normal zamanında iade
                statusHtml = `<span style="color:green; font-weight:bold;">Zamanında İade</span>`;
            }
            actionButton = `<button class="btn" disabled style="opacity:0.6; cursor:not-allowed;">İşlem Yok</button>`;
        
        } else if (isOverdue) {
            // --- DURUM 2: GECİKMİŞ (BORÇLU) ---
            const cezaFormatted = calculatedFine.toFixed(2);
            statusHtml = `<span style="color:red; font-weight:bold;">GECİKTİ (${cezaFormatted} TL)</span>`;
            
            actionButton = `
                <button class="btn btn-warning btn-pay-fine" data-id="${loan.odunc_id}" data-ceza="${cezaFormatted}">
                    <i class="fas fa-credit-card"></i> Ceza Öde
                </button>
            `;
        } else {
            // --- DURUM 3: NORMAL SÜREÇ ---
            statusHtml = `<span style="color:#007bff; font-weight:bold;">Ödünçte (Süresi Var)</span>`;
            actionButton = `<button class="btn btn-info btn-return" data-id="${loan.odunc_id}">İade Et</button>`;
        }

        return `
            <tr>
                <td>${loan.odunc_id}</td>
                <td>${memberName}</td>
                <td>${bookName}</td>
                <td>${loan.odunc_alma_tarihi || '-'}</td>
                <td>${loan.odunc_iade_tarihi || loan.iade_tarihi}</td>
                <td>${statusHtml}</td>
                <td>${actionButton}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="card">
            <h3 style="margin-bottom: 10px;">Ödünç Kayıtları</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Üye</th><th>Kitap</th><th>Alma T.</th><th>İade T.</th><th>Durum</th><th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
};

const fetchAndRenderLoans = async (container) => {
    container.innerHTML = '<h1>Ödünç ve İade İşlemleri</h1><p class="card" style="text-align: center;">Veriler Yükleniyor...</p>';
    
    const [loans, members, books] = await Promise.all([
        api.getLoans(),
        api.getMembers(),
        api.getBooks()
    ]);
    
   container.innerHTML = `
        <h1>Ödünç ve İade İşlemleri</h1>
        ${renderLoanForm(members, books)}
        <h2 style="color: var(--primary-color); margin-top: 20px; margin-bottom: 10px;">Tüm Kayıtlar</h2>
        <div id="loan-list-container">
            ${renderLoansList(loans, members, books)} </div>
    `;
    
    attachLoanListeners(document.getElementById('loan-list-container'));
    attachAddLoanListener();
};

const attachAddLoanListener = () => {
    const form = document.getElementById('add-loan-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const oduncVerisi = {
                uye_id: parseInt(formData.get('uye_id')),
                kitap_id: parseInt(formData.get('kitap_id')),
                // YENİ EKLENEN TARİH ALANLARI
                odunc_tarihi: formData.get('odunc_tarihi'), 
                iade_tarihi: formData.get('iade_tarihi')
            };

            // Basit kontrol: Tarih seçilmiş mi?
            if (!oduncVerisi.odunc_tarihi || !oduncVerisi.iade_tarihi) {
                 Swal.fire('Uyarı', 'Lütfen ödünç verme ve iade tarihlerini seçin.', 'warning');
                 return;
            }

            // API'yi çağırırken verileri obje olarak gönderiyoruz (API'nizin bunu desteklemesi gerekir)
            try {
                // API çağrısını yeni veri yapısına göre güncelledik
                await api.addLoan(oduncVerisi); 
                
                form.reset();
                Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Ödünç Verildi!',
                    text: 'İşlem başarıyla eklendi ve stok güncellendi.',
                    showConfirmButton: false,
                    timer: 2000 
                });
                
                fetchAndRenderLoans(document.getElementById('main-content'));
                
            } catch (error) {
                Swal.fire('Hata!', "Ödünç verme hatası: " + error.message, 'error');
            }
        });
    }
};

export const attachLoanListeners = (container) => {
    
    // 1. İADE ET BUTONU (Normal İade)
    container.querySelectorAll('.btn-return').forEach(button => {
        button.addEventListener('click', (e) => {
            const odunc_id = parseInt(e.target.dataset.id);
            Swal.fire({
                title: 'İade İşlemi',
                text: "Kitap iade alınacak. Onaylıyor musunuz?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Evet, İade Al',
                cancelButtonText: 'Vazgeç'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await api.returnLoan(odunc_id);
                        Swal.fire('Başarılı', 'Kitap iade alındı.', 'success');
                        // Sayfayı yenile (Hangi sayfadaysak onu)
                        const activeModule = window.location.hash === '#fines' ? finesModule : loansModule; 
                        // Basitçe o anki container'ı yenileyelim:
                        if(typeof fetchAndRenderLoans === 'function') fetchAndRenderLoans(document.getElementById('main-content'));
                        else if (typeof finesModule !== 'undefined') finesModule.loadPage(document.getElementById('main-content'));

                    } catch (error) {
                        Swal.fire('Hata', error.message, 'error');
                    }
                }
            });
        });
    });

    // 2. CEZA ÖDE BUTONU (KREDİ KARTI SİMÜLASYONU)
    container.querySelectorAll('.btn-pay-fine').forEach(button => {
        button.addEventListener('click', (e) => {
            // Tıklanan ikon olabilir, closest ile butonu bulalım
            const btn = e.target.closest('.btn-pay-fine');
            const odunc_id = parseInt(btn.dataset.id);
            const ceza = parseFloat(btn.dataset.ceza);

            Swal.fire({
                title: 'Güvenli Ödeme',
                html: `
                    <div style="text-align:left; margin-bottom:10px;">
                        <p style="margin-bottom:10px;">Ödenecek Tutar: <strong style="color:red; font-size:1.2em;">${ceza.toFixed(2)} TL</strong></p>
                        <label>Kart Sahibi</label>
                        <input id="cc-name" class="swal2-input" placeholder="Ad Soyad" style="margin-top:5px;">
                        
                        <label>Kart Numarası</label>
                        <input id="cc-number" class="swal2-input" placeholder="0000 0000 0000 0000" maxlength="19" style="margin-top:5px;">
                        
                        <div style="display:flex; gap:10px; margin-top:10px;">
                            <div style="flex:1">
                                <label>SKT</label>
                                <input id="cc-exp" class="swal2-input" placeholder="AA/YY" maxlength="5" style="margin-top:5px;"> 
                            </div>
                            <div style="flex:1">
                                <label>CVC</label>
                                <input id="cc-cvc" class="swal2-input" placeholder="123" maxlength="3" style="margin-top:5px;">
                            </div>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-lock"></i> Ödemeyi Tamamla',
                cancelButtonText: 'Vazgeç',
                focusConfirm: false,
                preConfirm: () => {
                    // Basit Doğrulama
                    const name = document.getElementById('cc-name').value;
                    const number = document.getElementById('cc-number').value;
                    const cvc = document.getElementById('cc-cvc').value;

                    if (!name || !number || !cvc) {
                        Swal.showValidationMessage('Lütfen tüm kart bilgilerini girin');
                        return false;
                    }
                    if (number.length < 16) {
                         Swal.showValidationMessage('Geçersiz kart numarası');
                         return false;
                    }
                    return { name, number }; // Verileri döndür
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // ÖDEME SİMÜLASYONU (Bekletme Ekranı)
                    let timerInterval;
                    Swal.fire({
                        title: 'Ödeme İşleniyor...',
                        html: 'Banka ile iletişim kuruluyor, lütfen bekleyin.',
                        timer: 2000, // 2 saniye bekle
                        timerProgressBar: true,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                        willClose: () => {
                            clearInterval(timerInterval);
                        }
                    }).then(async () => {
                        try {
                            await api.payFine(odunc_id, ceza);

                            Swal.fire({
                                icon: 'success',
                                title: 'Ödeme Başarılı!',
                                text: 'Tutar tahsil edildi ve kitap iade alındı.',
                                confirmButtonText: 'Tamam'
                            }).then(() => { 
                                
                                // --- DÜZELTME BAŞLANGICI ---
                                // Hangi sayfada olduğumuzu kontrol edip ona göre yenileme yapıyoruz
                                const currentRoute = localStorage.getItem('last_route'); // routing.js'de bunu kaydediyorduk

                                if (currentRoute === 'fines') {
                                    // Eğer Cezalar sayfasındaysak, Fines modülünü tekrar yükle
                                    import('./fines.js').then(module => {
                                        module.finesModule.loadPage(document.getElementById('main-content'));
                                    });
                                } else {
                                    // Değilse (Ödünç sayfasındaysak) Loans modülünü yenile
                                    if(typeof fetchAndRenderLoans === 'function') {
                                        fetchAndRenderLoans(document.getElementById('main-content'));
                                    }
                                }
                                // --- DÜZELTME BİTİŞİ ---

                            });

                        } catch (error) {
                            Swal.fire('Hata', 'Ödeme alınamadı: ' + error.message, 'error');
                        }
                    });
                }
            });
        });
    });
};

export const loansModule = {
    loadPage: fetchAndRenderLoans
};