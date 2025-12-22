import { api } from './api.js';

export const categoriesModule = {
    async loadPage(container) {
        container.innerHTML = '<h1>Kategori Yönetimi</h1><p>Yükleniyor...</p>';

        try {
            const categories = await api.getCategories();

            // SIRA NUMARASI EKLEME (index + 1)
            const categoryRows = categories.map((cat, index) => {
                const name = cat.kategoriAd || 'İsimsiz'; 
                const id = cat.kategoriId; 

                return `
                <tr>
                    <td style="font-weight:bold;">${index + 1}</td> <td>${name}</td>
                    <td>
                        <button class="btn btn-sm btn-danger btn-delete-cat" data-id="${id}" data-name="${name}">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </td>
                </tr>
                `;
            }).join('');

            container.innerHTML = `
                <h1>Kategori Yönetimi</h1>
                
                <div class="card" style="margin-bottom: 20px;">
                    <h3>Yeni Kategori Ekle</h3>
                    <form id="add-category-form" style="display: flex; gap: 10px; align-items: flex-end;">
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label>Kategori Adı</label>
                            <input type="text" name="kategori_ad" placeholder="Örn: Tarih" required>
                        </div>
                        <button type="submit" class="btn btn-success">Ekle</button>
                    </form>
                </div>

                <div class="card">
                    <h3>Mevcut Kategoriler</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th> <th>Kategori Adı</th>
                                <th style="width: 100px;">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categories.length > 0 ? categoryRows : '<tr><td colspan="3">Veri yok.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            attachCategoryListeners(container);

        } catch (error) {
            container.innerHTML = `<div class="alert error">Hata: ${error.message}</div>`;
        }
    }
};

const attachCategoryListeners = (container) => {
    // EKLEME İŞLEMİ
    const form = container.querySelector('#add-category-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = form.querySelector('input[name="kategori_ad"]');
            const val = input.value.trim();
            if (!val) return;

            try {
                await api.addCategory({ kategoriAd: val });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı',
                    showConfirmButton: false,
                    timer: 1000
                });
                categoriesModule.loadPage(document.getElementById('main-content'));
            } catch (error) {
                Swal.fire('Hata', error.message, 'error');
            }
        });
    }

    // SİLME İŞLEMİ
    container.querySelectorAll('.btn-delete-cat').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;

            Swal.fire({
                title: 'Silinsin mi?',
                text: `"${name}" kategorisi silinecek.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Evet, Sil',
                cancelButtonText: 'Vazgeç'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await api.deleteCategory(id);
                        
                        Swal.fire({
                            title: 'Silindi', 
                            icon: 'success',
                            timer: 1000,
                            showConfirmButton: false
                        });
                        
                        categoriesModule.loadPage(document.getElementById('main-content'));
                    } catch (error) {
                        Swal.fire('Hata', error.message, 'error');
                    }
                }
            });
        });
    });
};