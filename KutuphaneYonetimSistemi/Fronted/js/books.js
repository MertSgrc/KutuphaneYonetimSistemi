import { api } from './api.js';
import { auth } from './auth.js';
import { showToast } from './app.js';
import { router } from './routing.js';

// --- YÖNETİCİ/PERSONEL İÇİN FORM ---
const renderBookForm = (categories) => {
    const categoryOptions = categories.map(c => `<option value="${c.kategori_id}">${c.kategori_ad}</option>`).join('');
    
    return `
        <div class="card">
            <h2 style="color: var(--accent-color); margin-bottom: 20px;">Yeni Kitap Ekle</h2>
            <form id="add-book-form">
                <div class="form-group">
                    <label>Kitap Adı</label>
                    <input type="text" name="kitap_ad" required>
                </div>
                <div class="form-group">
                    <label>Yazar</label>
                    <input type="text" name="kitap_yazar" required>
                </div>
                <div class="form-group">
                    <label>Kategori</label>
                    <select name="kategori_id" required>
                        <option value="">Kategori Seçiniz</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Kapak Resmi URL (İsteğe Bağlı)</label>
                    <input type="text" name="kitap_resim" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label>Stok Adedi</label>
                    <input type="number" name="kitap_stok" value="1" min="0" required>
                </div>
                <button type="submit" class="btn btn-primary btn-full-width">Kitabı Kaydet</button>
            </form>
        </div>
    `;
};

// --- YÖNETİCİ/PERSONEL İÇİN TABLO GÖRÜNÜMÜ ---
const renderAdminTable = (books, categories) => {
    if (books.length === 0) return '<p class="alert info">Henüz kitap bulunmamaktadır.</p>';
    const getCategoryName = (id) => categories.find(c => c.kategori_id === id)?.kategori_ad || 'Bilinmeyen';
    
    const rows = books.map(kitap => {
        let stockClass = kitap.kitap_stok === 0 ? 'stock-out' : 'loan-status-ok';
        return `
            <tr>
                <td><img src="${kitap.kitap_resim}" alt="Kapak" style="height: 50px; width:auto;"></td>
                <td>${kitap.kitap_ad}</td>
                <td>${kitap.kitap_yazar}</td>
                <td>${getCategoryName(kitap.kategori_id)}</td>
                <td class="${stockClass}" style="text-align:center; font-weight:bold;">${kitap.kitap_stok}</td>
                <td>
                    <button class="btn btn-danger btn-delete-book" data-id="${kitap.kitap_id}">Sil</button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="card">
            <h3>Kitap Listesi ve Stok Durumu</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Resim</th><th>Kitap Adı</th><th>Yazar</th><th>Kategori</th><th>Stok</th><th>İşlemler</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
};

// --- ÜYELER İÇİN KATALOG GÖRÜNÜMÜ ---
const renderMemberCatalog = (books, categories) => {
    if (books.length === 0) return '<p class="alert info">Kütüphanemizde henüz kitap bulunmamaktadır.</p>';
    const getCategoryName = (id) => categories.find(c => c.kategori_id === id)?.kategori_ad || 'Genel';

    const cards = books.map(kitap => {
        const isOutOfStock = kitap.kitap_stok <= 0;
        const btnHtml = isOutOfStock 
            ? `<button class="btn" disabled style="background:#ccc; width:100%">Tükendi</button>`
            : `<button class="btn btn-primary btn-open-borrow-modal" data-id="${kitap.kitap_id}" data-title="${kitap.kitap_ad}" style="width:100%">Ödünç Al</button>`;

        return `
            <div class="book-card">
                <div class="book-image" style="background-image: url('${kitap.kitap_resim}');"></div>
                <div class="book-info">
                    <span class="book-category">${getCategoryName(kitap.kategori_id)}</span>
                    <h3 class="book-title">${kitap.kitap_ad}</h3>
                    <p class="book-author">${kitap.kitap_yazar}</p>
                    <div class="book-footer">
                        <span class="book-stock ${isOutOfStock ? 'no-stock' : ''}"><i class="fas fa-box"></i> Stok: ${kitap.kitap_stok}</span>
                    </div>
                    <div style="margin-top: 15px;">${btnHtml}</div>
                </div>
            </div>
        `;
    }).join('');

    return `<div class="book-grid">${cards}</div>`;
};

// --- ANA YÜKLEME ---
export const booksModule = {
    async loadPage(container) {
        const user = auth.getUser();
        const isAdminOrStaff = user.yetki === 'Yonetici' || user.yetki === 'Personel';
        
        container.innerHTML = `<h1>${isAdminOrStaff ? 'Kitap Yönetimi' : 'Kütüphane Kataloğu'}</h1><p>Yükleniyor...</p>`;

        try {
            const [categories, books] = await Promise.all([api.getCategories(), api.getBooks()]);
            let htmlContent = "";

            if (isAdminOrStaff) {
                htmlContent += renderBookForm(categories);
                htmlContent += renderAdminTable(books, categories);
            } else {
                htmlContent += `<p style="margin-bottom:20px;">İstediğiniz kitabı seçerek tarih belirleyip ödünç alabilirsiniz.</p>`;
                htmlContent += renderMemberCatalog(books, categories);
            }

            container.innerHTML = `<h1>${isAdminOrStaff ? 'Kitap Yönetimi' : 'Kütüphane Kataloğu'}</h1>` + htmlContent;

            if (isAdminOrStaff) attachAdminListeners();
            else attachMemberListeners();

        } catch (error) {
            container.innerHTML = `<div class="alert error">Hata: ${error.message}</div>`;
        }
    }
};

// --- OLAY DİNLEYİCİLERİ ---
const attachAdminListeners = () => {
    
    // --- 1. KİTAP EKLEME ---
    const form = document.getElementById('add-book-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const kitap = {
                kitap_ad: formData.get('kitap_ad'),
                kitap_yazar: formData.get('kitap_yazar'),
                kategori_id: parseInt(formData.get('kategori_id')),
                kitap_resim: formData.get('kitap_resim'),
                kitap_stok: parseInt(formData.get('kitap_stok')),
                kitap_durum: parseInt(formData.get('kitap_stok')) > 0
            };

            try {
                await api.addBook(kitap);
                
                Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Kitap Başarıyla Eklendi',
                    showConfirmButton: false,
                    timer: 1500
                });

                booksModule.loadPage(document.getElementById('main-content'));
                form.reset(); 

            } catch (error) { 
                Swal.fire('Hata', error.message, 'error');
            }
        });
    }

    // --- 2. KİTAP SİLME (HATA BURADAYDI, DÜZELDİ) ---
    document.querySelectorAll('.btn-delete-book').forEach(btn => { // Değişken adı: btn
        // DÜZELTME: Aşağıdaki satırda 'button' yerine 'btn' yazıldı.
        btn.addEventListener('click', (e) => { 
            const bookId = parseInt(e.target.dataset.id);

            Swal.fire({
                title: 'Emin misiniz?',
                text: "Bu kitabı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33', 
                cancelButtonColor: '#3085d6', 
                confirmButtonText: 'Evet, Sil',
                cancelButtonText: 'Vazgeç'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await api.deleteBook(bookId);
                        
                        Swal.fire(
                            'Silindi!',
                            'Kitap başarıyla silindi.',
                            'success'
                        );
                        
                        booksModule.loadPage(document.getElementById('main-content'));
                        
                    } catch(err) { 
                        Swal.fire('Hata', err.message, 'error');
                    }
                }
            });
        });
    });
};

const attachMemberListeners = () => {
    const modal = document.getElementById('borrow-modal');
    const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    const borrowForm = document.getElementById('borrow-form');

    // 1. Modalı Açma
    document.querySelectorAll('.btn-open-borrow-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const kitapId = e.target.dataset.id;
            const kitapAdi = e.target.dataset.title;

            // Modal İçeriğini Doldur
            document.getElementById('modal-book-id').value = kitapId;
            document.getElementById('modal-book-title').textContent = kitapAdi;

            // Tarihleri Ayarla (Bugün ve +14 gün)
            const today = new Date().toISOString().split('T')[0];
            const returnDateObj = new Date();
            returnDateObj.setDate(returnDateObj.getDate() + 14);
            const returnDate = returnDateObj.toISOString().split('T')[0];

            document.getElementById('modal-start-date').value = today;
            document.getElementById('modal-end-date').value = returnDate;

            // Modalı Göster
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('show'), 10); // Animasyon için
        });
    });

    // 2. Modalı Kapatma
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.classList.add('hidden'), 300);
        });
    });

    // 3. Form Submit (Onaylama)
    if (borrowForm) {
        // Dinleyiciyi temizlemek için replaceWith tekniği veya sadece bir kere tanımlandığından emin olma
        // Basitlik için burada direkt ekliyoruz, sayfa yenilendiği için sorun olmaz.
        borrowForm.onsubmit = async (e) => {
            e.preventDefault();
            const user = auth.getUser();
            const kitapId = parseInt(document.getElementById('modal-book-id').value);
            const alis = document.getElementById('modal-start-date').value;
            const iade = document.getElementById('modal-end-date').value;

            // Tarih Kontrolü
            if (new Date(iade) <= new Date(alis)) {
                showToast("İade tarihi alış tarihinden sonra olmalıdır!", "error");
                return;
            }

            try {
                await api.addLoan(user.id, kitapId, alis, iade);
                showToast("Kitap başarıyla ödünç alındı!", "success");
                
                // Modalı Kapat
                modal.classList.remove('show');
                setTimeout(() => modal.classList.add('hidden'), 300);

                // Sayfayı Yenile (Stok değişimi için)
                booksModule.loadPage(document.getElementById('main-content'));
            } catch (err) {
                showToast("Hata: " + err.message, "error");
            }
        };
    }
};