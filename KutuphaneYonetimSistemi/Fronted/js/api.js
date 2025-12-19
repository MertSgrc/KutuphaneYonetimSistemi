const API_BASE_URL = "http://localhost:8080/api";
const FINE_PER_DAY = 5.0; // Günlük ceza miktarı

// --- Yardımcı Fetch Fonksiyonu ---
// (Senin gönderdiğin yapıyı aynen korudum, bu kısım harika çalışıyor)
async function request(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    const options = {
        method: method,
        headers: headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Backend hata döndürürse yakala ve detaylı göster
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Hatası (${response.status}): ${errorText}`);
        }

        // DELETE işlemlerinde bazen içerik dönmez, hata yoksa true dönelim
        if (method === 'DELETE' && (response.status === 204 || response.status === 200)) {
            return true;
        }

        // JSON formatında cevap dön
        return await response.json();
    } catch (error) {
        console.error(`İstek Hatası (${endpoint}):`, error);
        // Hatayı fırlatıyoruz ki auth.js veya app.js bunu yakalayıp ekrana basabilsin
        throw error;
    }
}

export const api = {

    // --- GİRİŞ (LOGIN) ---
    // NOT: Senin kodunda tüm listeyi çekip tarayıcıda kontrol ediyorduk.
    // Ancak Java Controller'ımızda "/login" diye özel ve güvenli bir kapı var.
    // Orayı kullanmak en doğrusu ve en hatasızıdır. Senin yapına uygun şekilde buraya entegre ettim.
    login: async (identifier, password) => {
        try {
            // Sunucuya "Benim adım bu, şifrem bu, kontrol et" diyoruz.
            const response = await request('/login', 'POST', { 
                username: identifier, 
                password: password 
            });
            
            // Eğer sunucu "Tamam" derse, dönen kullanıcı bilgilerini veriyoruz.
            // Backend'den { id, ad, roleType... } gibi bir cevap döner.
            return response;

        } catch (error) {
            console.error("Giriş başarısız:", error);
            // Hata durumunda false dönüyoruz ki ekranda "Hatalı şifre" yazabilsin.
            return false;
        }
    },

    // --- KATEGORİ İŞLEMLERİ ---
    // Controller Endpoint: /categories
    getCategories: async () => {
        return await request('/categories');
    },

    addCategory: async (categoryData) => {
        
        let name;
        if (typeof categoryData === 'string') {
            name = categoryData;
        } else {
            
            name = categoryData.kategoriAd || categoryData.kategori_ad || categoryData.ad;
        }
            
        return await request('/categories', 'POST', { kategoriAd: name });
    },

    deleteCategory: async (id) => {
        await request(`/categories/${id}`, 'DELETE');
        return { success: true, message: "Kategori silindi." };
    },

    // --- KİTAP İŞLEMLERİ ---
    // Controller Endpoint: /books
    getBooks: async () => {
        return await request('/books');
    },

    addBook: async (kitapData) => {
        // Frontend formundan gelen verileri (snake_case), Java 'Kitap' modeline (camelCase) çeviriyoruz.
        // Kitap.java: ktpAd, yazar, ktpStok, yayinYili...
        const payload = {
            ktpAd: kitapData.kitap_ad || kitapData.ktpAd,
            yazar: kitapData.kitap_yazar || kitapData.yazar,
            ktpStok: parseInt(kitapData.kitap_stok || kitapData.ktpStok),
            yayinYili: kitapData.yayin_yili || null, // Tarih formatı: YYYY-MM-DD
            durum: "Aktif",
            kitapResim: kitapData.kitap_resim || "",
            // İlişkisel kayıt için ID gönderiyoruz
            kategoriId: parseInt(kitapData.kategori_id)
        };
        return await request('/books', 'POST', payload);
    },

    deleteBook: async (id) => {
        await request(`/books/${id}`, 'DELETE');
        return { success: true };
    },

    // --- ÖDÜNÇ (LOAN) İŞLEMLERİ ---
    // Controller Endpoint: /loans
    getLoans: async () => {
        const loans = await request('/loans');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Java'dan gelen veriye "ceza" bilgisini frontend tarafında hesaplayıp ekliyoruz
        return loans.map(o => {
            let cezaMiktari = 0;
            // Durum kontrolü: Pasif veya İade Edildi değilse ceza hesapla
            if (o.durum !== "Pasif" && o.durum !== "Iade Edildi") {
                const iadeTarihi = new Date(o.iadeTarihi || o.iade_tarihi);
                if (iadeTarihi < today) {
                    const diffTime = Math.abs(today - iadeTarihi);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    cezaMiktari = diffDays * FINE_PER_DAY;
                }
            }
            // Objeye ceza alanını ekle
            return { ...o, ceza: cezaMiktari };
        });
    },

   addLoan: async (arg1) => {
        let payload = {};

        if (typeof arg1 === 'object') {
            payload = {
                
                uye_id: parseInt(arg1.uye_id || arg1.uyeId),
                
                ktp_id: parseInt(arg1.kitap_id || arg1.ktpId),
                
                odunc_tarihi: arg1.odunc_tarihi || arg1.alis_tarihi,
                
                iade_tarihi: arg1.iade_tarihi,
                
                durum: "Aktif"
            };
        } else {
            console.error("HATA: addLoan fonksiyonuna obje gönderilmelidir.");
            return;
        }

        // console.log("Gönderilen Veri:", payload); // Hata ayıklama için açabilirsin
        return await request('/loans', 'POST', payload);
    },

    returnLoan: async (id) => {
        // İade işlemi için Backend'deki DELETE metodunu çağırıyoruz
        await request(`/loans/${id}`, 'DELETE');
        return { success: true, message: "Kitap iade alındı." };
    },

   payFine: async (oduncId, tutar) => {
        // ARTIK DELETE DEĞİL, POST İLE ÖZEL ENDPOINT'E GİDİYORUZ
        await request(`/loans/${oduncId}/pay`, 'POST');
        return { success: true, message: `Ödeme alındı (${tutar} TL) ve kitap iade edildi.` };
    },

    payFineWallet: async (oduncId, tutar) => {
        return await request(`/loans/${oduncId}/pay-wallet`, 'POST', { amount: parseFloat(tutar) });
    },

    // Para Yükle
    depositMoney: async (uyeId, miktar) => {
        return await request(`/members/${uyeId}/deposit`, 'POST', { amount: parseFloat(miktar) });
    },

    // --- ÜYE İŞLEMLERİ ---
    // Controller Endpoint: /members
    getMembers: async () => {
        return await request('/members');
    },

    registerMember: async (uyeData) => {
        // Java Uye.java Modeli: uye_ad, uye_soyad, uyeEmail, uye_telefon, sifre
        const payload = {
            uye_ad: uyeData.uye_ad,
            uye_soyad: uyeData.uye_soyad,
            uyeEmail: uyeData.uye_email || uyeData.uyeEmail, // Backend'de camelCase 'uyeEmail'
            uye_telefon: uyeData.uye_telefon,
            sifre: uyeData.sifre,
            // Eğer tarih boşsa bugünü ata
            uyeKayitTarihi: new Date().toISOString().split('T')[0]
        };
        return await request('/members', 'POST', payload);
    },

    verifyEmail: async (email, code) => {
        // Backend'deki /api/verify endpoint'ine istek atar
        return await request('/verify', 'POST', { email, code });
    },

    deleteMember: async (id) => {
        await request(`/members/${id}`, 'DELETE');
        return { success: true };
    },

    // --- PERSONEL İŞLEMLERİ ---
    // Controller Endpoint: /staff
    getStaff: async () => {
        return await request('/staff');
    },

    addStaff: async (personelData) => {
        // Java Personel.java Modeli: personel_ad, personel_soyad, kullaniciAdi, sifre, yetki
        const payload = {
            personel_ad: personelData.personel_ad,
            personel_soyad: personelData.personel_soyad,
            kullaniciAdi: personelData.kullanici_adi || personelData.kullaniciAdi,
            sifre: personelData.sifre,
            yetki: personelData.yetki || "Personel"
        };
        return await request('/staff', 'POST', payload);
    },

    deleteStaff: async (id) => {
        await request(`/staff/${id}`, 'DELETE');
        return { success: true };
    }
};