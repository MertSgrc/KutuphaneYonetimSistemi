import { api } from './api.js';

const renderLoanForm = (members, books) => {
    const memberOptions = members.map(m => `<option value="${m.uye_id}">${m.uye_id} - ${m.uye_ad} ${m.uye_soyad}</option>`).join('');
    
    // Sadece stokta olan kitapları göster
    const bookOptions = books
        .filter(b => b.ktpStok > 0)
        .map(b => `<option value="${b.ktpId}">${b.ktpAd} (${b.ktpStok} adet)</option>`).join('');

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
    if (!loans || loans.length === 0) return '<p class="alert info">Henüz ödünç işlemi yapılmamıştır.</p>';

    const rows = loans.map(loan => {
        
        const member = members.find(m => m.uye_id === loan.uye_id);
        const memberName = member ? `${member.uye_ad} ${member.uye_soyad}` : 'Bilinmiyor';
        
        const book = books.find(b => b.ktpId === loan.ktp_id);
        const bookName = book ? book.ktpAd : 'Bilinmiyor';

        // Gecikme Hesaplama
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const iadeTarihi = new Date(loan.iade_tarihi);
        
        let calculatedFine = 0;
        let isOverdue = false;

        const isReturned = loan.durum === "İade Edildi" || loan.durum === "Pasif";
        
        if (!isReturned && iadeTarihi < today) {
            const diffTime = Math.abs(today - iadeTarihi);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            calculatedFine = diffDays * 5; // Günlük 5 TL
            isOverdue = true;
        }

        let statusHtml;
        let actionButton;

        if (isReturned) {
            if (loan.odeme_yapildi === true) {
                statusHtml = `
                    <span class="badge" style="background-color:#28a745; color:white; padding:5px 10px; border-radius:15px;">
                        <i class="fas fa-check-double"></i> Ödeme Alındı, İade Edildi
                    </span>`;
            } else {
                statusHtml = `
                    <span class="badge" style="background-color:#6c757d; color:white; padding:5px 10px; border-radius:15px;">
                        <i class="fas fa-check"></i> İade Edildi
                    </span>`;
            }
            actionButton = `<button class="btn" disabled style="opacity:0.6; cursor:not-allowed;">İşlem Tamam</button>`;
        
        } else if (isOverdue) {
            const cezaFormatted = calculatedFine.toFixed(2);
            statusHtml = `<span style="color:red; font-weight:bold;">GECİKTİ (${cezaFormatted} TL)</span>`;
            
            actionButton = `
                <button class="btn btn-warning btn-pay-fine" data-id="${loan.odunc_id}" data-ceza="${cezaFormatted}">
                    <i class="fas fa-credit-card"></i> Ceza Öde
                </button>
            `;
        } else {
            statusHtml = `<span style="color:#007bff; font-weight:bold;">${loan.durum || 'Ödünçte'}</span>`;
            actionButton = `<button class="btn btn-info btn-return" data-id="${loan.odunc_id}">İade Et</button>`;
        }

        return `
            <tr>
                <td>${loan.odunc_id}</td>
                <td>${memberName}</td>
                <td>${bookName}</td>
                <td>${loan.odunc_tarihi || '-'}</td>
                <td>${loan.iade_tarihi || '-'}</td>
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
    
    try {
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
    } catch (e) {
        container.innerHTML = `<div class="alert error">Hata: ${e.message}</div>`;
    }
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
                odunc_tarihi: formData.get('odunc_tarihi'), 
                iade_tarihi: formData.get('iade_tarihi')
            };

            if (!oduncVerisi.odunc_tarihi || !oduncVerisi.iade_tarihi) {
                 Swal.fire('Uyarı', 'Lütfen ödünç verme ve iade tarihlerini seçin.', 'warning');
                 return;
            }

            try {
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
    
    // 1. İADE ET BUTONU
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
                        
                        if(typeof fetchAndRenderLoans === 'function') fetchAndRenderLoans(document.getElementById('main-content'));
                        
                    } catch (error) {
                        Swal.fire('Hata', error.message, 'error');
                    }
                }
            });
        });
    });

   // 2. CEZA ÖDE BUTONU (SEÇENEKLİ)
    container.querySelectorAll('.btn-pay-fine').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-pay-fine');
            const odunc_id = parseInt(btn.dataset.id);
            const ceza = parseFloat(btn.dataset.ceza);

            // ÖDEME YÖNTEMİ SEÇİMİ
            Swal.fire({
                title: 'Ödeme Yöntemi',
                text: `Ödenecek Tutar: ${ceza.toFixed(2)} TL`,
                icon: 'info',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-wallet"></i> Cüzdan ile Öde',
                denyButtonText: '<i class="fas fa-credit-card"></i> Kredi Kartı ile Öde',
                cancelButtonText: 'Vazgeç',
                confirmButtonColor: '#28a745', 
                denyButtonColor: '#007bff'    
            }).then(async (result) => {
                
                // --- SEÇENEK 1: CÜZDAN İLE ÖDE ---
                if (result.isConfirmed) {
                    try {
                        const response = await api.payFineWallet(odunc_id, ceza);
                        Swal.fire('Başarılı!', response.message, 'success');
                        refreshPage();
                    } catch (err) {
                        Swal.fire('Hata', err.message, 'error');
                    }
                } 
                
                // --- SEÇENEK 2: KREDİ KARTI İLE ÖDE ---
                else if (result.isDenied) {
                    // Kart girişi ekranını aç 
                    openCreditCardModal(odunc_id, ceza);
                }
            });
        });
    });
};

// Yardımcı: Sayfayı yenileme
const refreshPage = () => {
    const currentRoute = localStorage.getItem('last_route');
    if (currentRoute === 'fines') {
        import('./fines.js').then(m => m.finesModule.loadPage(document.getElementById('main-content')));
    } else {
        if(typeof fetchAndRenderLoans === 'function') fetchAndRenderLoans(document.getElementById('main-content'));
    }
}

// --- GÜNCELLENEN KISIM: KREDİ KARTI MODALI ---
const openCreditCardModal = (odunc_id, ceza) => {
    Swal.fire({
        title: 'Güvenli Ödeme (Kart)',
        html: `
            <div style="text-align:left;">
                <p>Tutar: <strong>${ceza.toFixed(2)} TL</strong></p>
                <label>Kart Numarası</label>
                <input id="cc-num" class="swal2-input" placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="off" name="cc_field_${Math.random()}">
                
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <div style="flex:1">
                        <label>SKT</label>
                        <input id="cc-exp" class="swal2-input" placeholder="AA/YY" maxlength="5" autocomplete="off" name="exp_field_${Math.random()}">
                    </div>
                    <div style="flex:1">
                        <label>CVC</label>
                        <input id="cc-cvc" class="swal2-input" placeholder="123" maxlength="3" autocomplete="off" name="cvc_field_${Math.random()}">
                    </div>
                </div>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'Öde',
        didOpen: () => {
            // Maskeleme kodları
            const n = Swal.getPopup().querySelector('#cc-num');
            const e = Swal.getPopup().querySelector('#cc-exp');
            n.addEventListener('input', ev => {
                let v = ev.target.value.replace(/\D/g,''), f='';
                for(let i=0;i<v.length;i++){if(i>0&&i%4===0)f+=' ';f+=v[i]}
                ev.target.value=f;
            });
            e.addEventListener('input', ev => {
                let v=ev.target.value.replace(/\D/g,'').substring(0,4);
                ev.target.value = v.length>=3 ? v.substring(0,2)+'/'+v.substring(2) : v;
            });
        },
        preConfirm: () => {
            if(document.getElementById('cc-num').value.length<16) Swal.showValidationMessage('Kart no eksik');
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            try {
                await api.payFine(odunc_id, ceza); 
                Swal.fire('Başarılı', 'Karttan çekildi ve iade alındı.', 'success');
                refreshPage();
            } catch (err) { Swal.fire('Hata', err.message, 'error'); }
        }
    });
};

export const loansModule = {
    loadPage: fetchAndRenderLoans
};