import { api } from './api.js';
import { auth } from './auth.js';

export const profileModule = {
    async loadPage(container) {
        const user = auth.getUser();
        if (!user) return; 

        container.innerHTML = '<h1>Profilim</h1><p>Veriler yükleniyor...</p>';

        // --- 1. YÖNETİCİ veya PERSONEL İSE ---
        if (user.roleType === 'staff' || user.yetki === 'Yonetici' || user.yetki === 'Personel') {
            try {
                // İsmini ve Soyismini tam bulmak için personel listesini çekelim
                const staffList = await api.getStaff();
                // Giriş yapan id ile listedeki id'yi eşleştirelim
                const me = staffList.find(p => p.personel_id === (user.id || user.personel_id));
                
                // Eğer listede bulamazsa session'daki adı kullanır
                const adSoyad = me ? `${me.personel_ad} ${me.personel_soyad}` : user.ad;
                const unvan = me ? me.yetki : (user.yetki || 'Personel');
                
                // Ünvanı güzelleştirelim
                const displayUnvan = unvan === 'Yonetici' ? 'Sistem Yöneticisi (Admin)' : 'Kütüphane Görevlisi';

                container.innerHTML = `
                    <h1>Profilim</h1>
                    <div class="card" style="text-align: center; padding: 40px;">
                        <div style="width: 100px; height: 100px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3em; margin: 0 auto 20px auto;">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <h2 style="color: var(--primary-color); margin-bottom: 10px;">${adSoyad}</h2>
                        <p style="font-size: 1.2em; color: #666; font-weight: bold;">${displayUnvan}</p>
                        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
                        <p style="color: #888;">
                            Yönetici paneline hoş geldiniz. Sol menüden işlemleri gerçekleştirebilirsiniz.
                        </p>
                    </div>
                `;
                return; // Yöneticiysen aşağıya inme, işlem bitti.

            } catch (err) {
                console.error("Personel bilgisi alınamadı", err);
            }
        }

        // --- 2. EĞER ÜYE İSE (Aşağıdaki kodlar eskisi gibi çalışır) ---
        
        let currentUserData = user;
        try {
            const members = await api.getMembers();
            const currentId = user.id || user.uye_id;
            const found = members.find(m => m.uye_id === currentId);
            if(found) currentUserData = found;
        } catch(e) { console.error(e); }

        try {
            const [loans, books] = await Promise.all([api.getLoans(), api.getBooks()]);
            const userId = currentUserData.uye_id || currentUserData.id;
            const myLoans = loans.filter(l => l.uye_id === userId);
            
            let totalDebt = 0;
            const today = new Date();
            today.setHours(0,0,0,0);

            let userBalance = 0.0;
            if (currentUserData.bakiye !== null && currentUserData.bakiye !== undefined) {
                userBalance = parseFloat(currentUserData.bakiye);
            }

            const historyRows = myLoans.map(loan => {
                const book = books.find(b => b.ktpId === loan.ktp_id);
                const bookName = book ? book.ktpAd : 'Bilinmiyor';
                
                let iadeTarihiStr = loan.iade_tarihi;
                const dueDate = iadeTarihiStr ? new Date(iadeTarihiStr) : new Date();
                
                let statusBadge = '';
                let rowClass = '';
                let debtAmount = 0;
                let actionButton = '-';
                
                const isReturned = loan.durum === "İade Edildi" || loan.durum === "Pasif";
                
                if (!isReturned) {
                    if (dueDate < today) {
                        const diffDays = Math.ceil(Math.abs(today - dueDate) / (1000 * 60 * 60 * 24));
                        debtAmount = diffDays * 5; 
                        totalDebt += debtAmount;
                        statusBadge = `<span class="badge" style="background:var(--danger-color); color:white;">GECİKTİ (${diffDays} Gün)</span>`;
                        rowClass = 'background-color: #fff3cd;';
                        actionButton = `
                            <button class="btn btn-sm btn-warning btn-pay-action" 
                                data-id="${loan.odunc_id}" 
                                data-ceza="${debtAmount.toFixed(2)}">
                                <i class="fas fa-credit-card"></i> Borcu Öde
                            </button>`;
                    } else {
                        statusBadge = `<span class="badge" style="background:var(--info-color); color:white;">Okunuyor</span>`;
                        actionButton = `
                            <button class="btn btn-sm btn-info btn-return-action" 
                                data-id="${loan.odunc_id}" 
                                data-book="${bookName}">
                                <i class="fas fa-undo"></i> İade Et
                            </button>`;
                    }
                } else {
                    if (loan.odeme_yapildi) statusBadge = `<span class="badge" style="background:var(--success-color); color:white;">Ödendi & İade</span>`;
                    else statusBadge = `<span class="badge" style="background:#6c757d; color:white;">İade Edildi</span>`;
                }

                const displayDebt = debtAmount > 0 ? debtAmount : 0;

                return `
                    <tr style="${rowClass}">
                        <td>${bookName}</td>
                        <td>${loan.odunc_tarihi || '-'}</td>
                        <td>${loan.iade_tarihi || '-'}</td>
                        <td>${displayDebt > 0 ? `<b style="color:red">${displayDebt.toFixed(2)} TL</b>` : '-'}</td>
                        <td>${statusBadge}</td>
                        <td style="text-align:center;">${actionButton}</td>
                    </tr>
                `;
            }).reverse().join('');

            const content = `
                <div class="card-grid" style="margin-bottom: 20px;">
                    <div class="stat-card" style="border-left: 5px solid var(--primary-color);">
                        <h3 style="color:#333;">${currentUserData.uye_ad || 'Üye'} ${currentUserData.uye_soyad || ''}</h3>
                        <p style="font-size: 0.9em; color:#666;">Kütüphane Üyesi</p>
                    </div>

                    <div class="stat-card" style="border-left: 5px solid var(--success-color); background:#e8f9ed;">
                        <h3 style="color: var(--success-color);">Cüzdan Bakiyem</h3>
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <p style="font-size: 1.5em; font-weight:bold; margin:0;">${userBalance.toFixed(2)} TL</p>
                            <button id="btn-deposit" class="btn btn-sm btn-success" style="margin-left:10px;">
                                <i class="fas fa-plus"></i> Yükle
                            </button>
                        </div>
                    </div>

                    <div class="stat-card" style="border-left: 5px solid var(--warning-color); background:#fff3cd;">
                        <h3 style="color: #856404;">Güncel Borcum</h3>
                        <p style="font-size: 1.5em; font-weight:bold; color:${totalDebt > 0 ? 'red' : 'green'}">
                            ${totalDebt.toFixed(2)} TL
                        </p>
                    </div>
                </div>

                <div class="card">
                    <h2 style="margin-bottom:15px; color:var(--primary-color);">Kitaplarım ve Geçmişim</h2>
                    <table class="data-table">
                        <thead><tr><th>Kitap</th><th>Alış</th><th>İade T.</th><th>Ceza</th><th>Durum</th><th>İşlem</th></tr></thead>
                        <tbody>${historyRows || '<tr><td colspan="6">Kaydınız yok.</td></tr>'}</tbody>
                    </table>
                </div>
            `;

            container.innerHTML = content;
            attachProfileListeners(container, userId, userBalance);

        } catch (error) {
            container.innerHTML = `<div class="alert error">Hata: ${error.message}</div>`;
        }
    }
};

// --- OLAY DİNLEYİCİLERİ (ÜYELER İÇİN) ---
const attachProfileListeners = (container, userId, currentBalance) => {
    
    // 1. PARA YÜKLEME
    document.getElementById('btn-deposit')?.addEventListener('click', () => {
        Swal.fire({
            title: 'Bakiye Yükle',
            input: 'number',
            inputLabel: 'Tutar (TL)',
            inputPlaceholder: '50',
            showCancelButton: true,
            confirmButtonText: 'Kart Bilgilerini Gir'
        }).then((res) => {
            if (res.isConfirmed && res.value > 0) {
                const amount = res.value;
                Swal.fire({
                    title: 'Güvenli Ödeme',
                    html: `
                        <div style="text-align:left;">
                            <p>Yüklenecek Tutar: <strong>${amount} TL</strong></p>
                            <label>Kart Numarası</label>
                            <input id="cc-num" class="swal2-input" placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="off" name="rnd_${Math.random()}">
                            <div style="display:flex; gap:10px; margin-top:10px;">
                                <div style="flex:1"><label>SKT</label><input id="cc-exp" class="swal2-input" placeholder="AA/YY" maxlength="5" autocomplete="off"></div>
                                <div style="flex:1"><label>CVC</label><input id="cc-cvc" class="swal2-input" placeholder="123" maxlength="3" autocomplete="off"></div>
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Ödemeyi Onayla',
                    didOpen: () => {
                        const n = Swal.getPopup().querySelector('#cc-num');
                        const e = Swal.getPopup().querySelector('#cc-exp');
                        n.addEventListener('input', ev => {
                            let v=ev.target.value.replace(/\D/g,''), f='';
                            for(let i=0;i<v.length;i++){if(i>0&&i%4===0)f+=' ';f+=v[i]}
                            ev.target.value=f;
                        });
                        e.addEventListener('input', ev => {
                            let v=ev.target.value.replace(/\D/g,'').substring(0,4);
                            ev.target.value = v.length>=3 ? v.substring(0,2)+'/'+v.substring(2) : v;
                        });
                    },
                    preConfirm: () => { if(document.getElementById('cc-num').value.length < 16) Swal.showValidationMessage('Kart no eksik'); }
                }).then(async (payRes) => {
                    if(payRes.isConfirmed) {
                        try {
                            await api.depositMoney(userId, amount);
                            Swal.fire('Başarılı', 'Bakiye yüklendi.', 'success');
                            profileModule.loadPage(container);
                        } catch(err) { Swal.fire('Hata', err.message, 'error'); }
                    }
                });
            }
        });
    });

    // 2. İADE ET
    container.querySelectorAll('.btn-return-action').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('button').dataset.id;
            const bookName = e.target.closest('button').dataset.book;
            const res = await Swal.fire({ title: 'İade Et', text: `"${bookName}" iade edilsin mi?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Evet' });
            if (res.isConfirmed) {
                try { await api.returnLoan(id); Swal.fire('Başarılı', 'İade edildi.', 'success'); profileModule.loadPage(container); }
                catch(err) { Swal.fire('Hata', err.message, 'error'); }
            }
        });
    });

    // 3. BORÇ ÖDE
    container.querySelectorAll('.btn-pay-action').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('button').dataset.id;
            const ceza = parseFloat(e.target.closest('button').dataset.ceza);
            Swal.fire({
                title: 'Gecikme Cezası',
                text: `${ceza} TL ceza var.`,
                icon: 'warning',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: `Cüzdanla (${currentBalance} TL)`,
                denyButtonText: 'Kartla',
                confirmButtonColor: '#28a745', denyButtonColor: '#007bff'
            }).then(async (res) => {
                if (res.isConfirmed) {
                    try { await api.payFineWallet(id, ceza); Swal.fire('Başarılı', 'Cüzdandan ödendi.', 'success'); profileModule.loadPage(container); }
                    catch(err) { Swal.fire('Hata', err.message, 'error'); }
                } else if (res.isDenied) {
                    try { await api.payFine(id, ceza); Swal.fire('Başarılı', 'Karttan ödendi.', 'success'); profileModule.loadPage(container); }
                    catch(err) { Swal.fire('Hata', err.message, 'error'); }
                }
            });
        });
    });
};