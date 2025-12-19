import { api } from './api.js';
import { showToast } from './app.js'; 

// --- FORM HTML ---
const renderMemberForm = () => `
    <div class="card">
        <h2 style="color: var(--accent-color); margin-bottom: 20px;">Yeni Üye Kaydı</h2>
        <form id="add-member-form">
            <div class="form-group"><input type="text" name="uye_ad" placeholder="Ad" required></div>
            <div class="form-group"><input type="text" name="uye_soyad" placeholder="Soyad" required></div>
            <div class="form-group"><input type="email" name="uye_email" placeholder="E-posta" required></div>
            <div class="form-group"><input type="text" name="uye_telefon" placeholder="Telefon (5xxxxxxxxx)" maxlength="11"></div>
            <div class="form-group"><input type="password" name="sifre" placeholder="Şifre" required></div>
            <button type="submit" class="btn btn-primary btn-full-width">Üyeyi Kaydet</button>
        </form>
    </div>
`;

// --- LİSTE HTML ---
const renderMemberList = (members) => {
    if (!members || members.length === 0) return '<p class="alert info">Henüz kayıtlı üye bulunmamaktadır.</p>';

    // DEĞİŞİKLİK BURADA: (uye, index) yapısı kullanıldı
    const rows = members.map((uye, index) => {
        const email = uye.uyeEmail || uye.uye_email || '-'; 

        return `
        <tr>
            <td style="font-weight:bold;">${index + 1}</td> <td>${uye.uye_ad} ${uye.uye_soyad}</td>
            <td>${email}</td>
            <td>${uye.uye_telefon || '-'}</td>
            <td>
                <button class="btn btn-danger btn-delete-member" data-id="${uye.uye_id}">Sil</button>
            </td>
        </tr>
    `}).join('');

    return `
        <div class="card">
            <h3>Kayıtlı Üyeler</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th> <th>Ad Soyad</th>
                        <th>E-posta</th>
                        <th>Telefon</th>
                        <th>İşlem</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
};

// --- ANA YÜKLEME ---
const fetchAndRenderMembers = async (listContainer) => {
    listContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>';
    try {
        const members = await api.getMembers();
        listContainer.innerHTML = renderMemberList(members);
        attachDeleteListener(listContainer);
    } catch (error) {
        listContainer.innerHTML = `<p class="alert error">Hata: ${error.message}</p>`;
    }
};

// --- EVENTS ---
const attachFormListener = () => {
    const form = document.getElementById('add-member-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                await api.registerMember(data); 
                
                showToast('Üye başarıyla eklendi.', 'success'); 
                form.reset();
                fetchAndRenderMembers(document.getElementById('member-list-container'));
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
};

const attachDeleteListener = (container) => {
    container.querySelectorAll('.btn-delete-member').forEach(btn => {
        btn.addEventListener('click', (e) => { 
            const memberId = parseInt(e.target.dataset.id);

            Swal.fire({
                title: 'Emin misiniz?',
                text: "Bu üyeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33', 
                cancelButtonColor: '#3085d6', 
                confirmButtonText: 'Evet, Sil',
                cancelButtonText: 'Vazgeç'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await api.deleteMember(memberId);
                        
                        Swal.fire(
                            'Silindi!',
                            'Üye başarıyla silindi.',
                            'success'
                        );

                        fetchAndRenderMembers(document.getElementById('member-list-container'));

                    } catch (error) {
                        Swal.fire(
                            'Hata!',
                            error.message,
                            'error'
                        );
                    }
                }
            });
        });
    });
};

export const memberModule = {
    async loadPage(container) {
        container.innerHTML = `
            <h1>Üyeler Yönetimi</h1>
            ${renderMemberForm()}
            <div id="member-list-container"></div>
        `;
        await fetchAndRenderMembers(document.getElementById('member-list-container'));
        attachFormListener();
    }
};