import { api } from './api.js';
import { auth } from './auth.js';
import { showToast } from './app.js';

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
    if (!staff || staff.length === 0) return '<p class="alert info">Personel bulunamadı.</p>';
    const currentUser = auth.getUser();

    const rows = staff.map(p => {
        // Java Model Uyumu: kullaniciAdi (camelCase)
        // Backend 'kullaniciAdi' gönderir.
        const kAdi = p.kullaniciAdi || p.kullanici_adi; 
        
        return `
        <tr>
            <td>${p.personel_id}</td>
            <td>${p.personel_ad} ${p.personel_soyad}</td>
            <td>${kAdi}</td>
            <td>${p.yetki}</td>
            <td>
                ${p.personel_id !== currentUser.id ? 
                  `<button class="btn btn-danger btn-delete-staff" data-id="${p.personel_id}">Sil</button>` : 
                  '<span style="color:#aaa; font-size:0.9em;">(Siz)</span>'}
            </td>
        </tr>
    `}).join('');

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
        
        container.querySelectorAll('.btn-delete-staff').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const staffId = parseInt(e.target.dataset.id);

                Swal.fire({
                    title: 'Emin misiniz?',
                    text: "Bu personeli silmek istediğinize emin misiniz?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Evet, Sil',
                    cancelButtonText: 'Vazgeç'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            await api.deleteStaff(staffId);
                            Swal.fire('Silindi!', 'Personel başarıyla silindi.', 'success');
                            fetchAndRenderStaff(container);
                        } catch(err) { 
                            Swal.fire('Hata!', err.message, 'error');
                        }
                    }
                });
            });
        });

    } catch (error) {
        container.innerHTML = `<p class="alert error" style="color:red; text-align:center;">Hata: ${error.message}</p>`;
    }
};

const attachFormListener = () => {
    const form = document.getElementById('add-staff-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            // api.js addStaff fonksiyonu 'kullanici_adi' -> 'kullaniciAdi' dönüşümünü yapar.
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