import { api } from './api.js';
import { auth } from './auth.js';
import { showToast } from './app.js'; // İMPORT EKLENDİ

const renderStaffForm = () => `
    <div class="card">
        <h2 style="color: var(--accent-color); margin-bottom: 20px;">Personel Ekle</h2>
        <form id="add-staff-form">
            <div class="form-group"><input type="text" name="personel_ad" placeholder="Ad" required></div>
            <div class="form-group"><input type="text" name="personel_soyad" placeholder="Soyad" required></div>
            <div class="form-group"><input type="text" name="kullanici_adi" placeholder="Kullanıcı Adı" required></div>
            <div class="form-group"><input type="password" name="sifre" placeholder="Şifre" required></div>
            <div class="form-group">
                <select name="yetki" required>
                    <option value="Personel">Personel</option>
                    <option value="Yonetici">Yönetici</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-full-width">Kaydet</button>
        </form>
    </div>
`;

const renderStaffList = (staff) => {
    if (staff.length === 0) return '<p class="alert info">Personel bulunamadı.</p>';
    const currentUser = auth.getUser();

    const rows = staff.map(p => `
        <tr>
            <td>${p.personel_id}</td>
            <td>${p.personel_ad} ${p.personel_soyad}</td>
            <td>${p.kullanici_adi}</td>
            <td>${p.yetki}</td>
            <td>
                ${p.personel_id !== currentUser.id ? 
                  `<button class="btn btn-danger btn-delete-staff" data-id="${p.personel_id}">Sil</button>` : 
                  '<span style="color:#aaa; font-size:0.9em;">(Siz)</span>'}
            </td>
        </tr>
    `).join('');

    return `
        <div class="card">
            <h3>Personel Listesi</h3>
            <table class="data-table">
                <thead><tr><th>ID</th><th>Ad Soyad</th><th>Kullanıcı Adı</th><th>Yetki</th><th>İşlem</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
};

const fetchAndRenderStaff = async (container) => {
    container.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>';
    
    try {
        const staff = await api.getStaff();
        container.innerHTML = renderStaffList(staff);
        
        // Silme dinleyicisi
        container.querySelectorAll('.btn-delete-staff').forEach(btn => {
            btn.addEventListener('click', (e) => { // async'i buradan kaldırdık, aşağıya taşıdık
                const staffId = parseInt(e.target.dataset.id);

                // 1. Kullanıcıya sor (Eski confirm yerine)
                Swal.fire({
                    title: 'Emin misiniz?',
                    text: "Bu personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33', // Silme butonu kırmızı
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Evet, Sil',
                    cancelButtonText: 'Vazgeç'
                }).then(async (result) => {
                    
                    // 2. Kullanıcı "Evet" derse işlemi yap
                    if (result.isConfirmed) {
                        try {
                            await api.deleteStaff(staffId);
                            
                            // Başarılı olursa büyük yeşil onay
                            Swal.fire(
                                'Silindi!',
                                'Personel başarıyla silindi.',
                                'success'
                            );

                            // Listeyi yenile
                            fetchAndRenderStaff(container);
                            
                        } catch(err) { 
                            // Hata olursa kırmızı uyarı
                            Swal.fire(
                                'Hata!',
                                err.message,
                                'error'
                            );
                        }
                    }
                });
            });
        });

    } catch (error) {
        // Liste yüklenemezse sayfaya hata bas (Burası HTML içi olduğu için alert değil, kalabilir)
        container.innerHTML = `<p class="alert error" style="color:red; text-align:center;">Hata: ${error.message}</p>`;
    }
};

const attachFormListener = () => {
    const form = document.getElementById('add-staff-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                await api.addStaff(data);
                showToast("Personel eklendi.", "success");
                form.reset();
                fetchAndRenderStaff(document.getElementById('staff-list-container'));
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }
};

export const staffModule = {
    async loadPage(container) {
        container.innerHTML = `
            <h1>Personel Yönetimi</h1>
            ${renderStaffForm()}
            <div id="staff-list-container"></div>
        `;
        await fetchAndRenderStaff(document.getElementById('staff-list-container'));
        attachFormListener();
    }
};