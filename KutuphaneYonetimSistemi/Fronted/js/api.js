const delay = 300;
const FINE_PER_DAY = 5.0; // Günlük ceza miktarını buradan 5 TL olarak güncelledik
const LOAN_DAYS = 14;

// --- Helper Functions ---
const saveToDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const loadFromDB = (key, defaultData) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
};

// --- Initial Data (Sadece ilk yüklemede kullanılır) ---
const initialMembers = [
    { uye_id: 1, uye_ad: "Ali", uye_soyad: "Yılmaz", uye_telefon: "5551234567", uye_email: "ali@test.com", uye_kayit_tarihi: "2023-10-01", sifre: "1234" },
    { uye_id: 2, uye_ad: "Ayşe", uye_soyad: "Demir", uye_telefon: "5559876543", uye_email: "ayse@test.com", uye_kayit_tarihi: "2024-01-15", sifre: "1234" }
];
const initialBooks = [
    { 
        kitap_id: 1, 
        kategori_id: 1, 
        kitap_ad: "Temiz Kod", 
        kitap_yazar: "Robert C. Martin", 
        kitap_stok: 5, 
        kitap_durum: true,
        kitap_resim: "https://m.media-amazon.com/images/I/5154eV8zPIL._SL500_.jpg" 
    },
    { 
        kitap_id: 2, 
        kategori_id: 2, 
        kitap_ad: "Sefiller", 
        kitap_yazar: "Victor Hugo", 
        kitap_stok: 3, 
        kitap_durum: true,
        kitap_resim: "https://i.dr.com.tr/cache/600x600/0/0000000064052_1.jpg" 
    }
];
const initialPersonel = [
    { personel_id: 1, personel_ad: "Sistem", personel_soyad: "Yöneticisi", kullanici_adi: "admin", sifre: "12345", yetki: "Yonetici" },
    { personel_id: 2, personel_ad: "Ahmet", personel_soyad: "Personel", kullanici_adi: "personel", sifre: "12345", yetki: "Personel" }
];
const initialCategories = [
    { id: 1, kategori_ad: "Yazılım" }, // ID isimlendirmesini standartlaştırdık
    { id: 2, kategori_ad: "Roman" }
];

// --- Load Initial Data into Memory ---
// Not: Fonksiyonlar içinde veriyi tazelemek için loadFromDB tekrar çağrılacaktır.
let mockMembers = loadFromDB('kys_members', initialMembers);
let mockKitaplar = loadFromDB('kys_books', initialBooks);
let mockOdunc = loadFromDB('kys_loans', []);
let mockPersonel = loadFromDB('kys_staff', initialPersonel);
// Kategorileri initialCategories ile başlatıyoruz ama id yapısına dikkat et
let mockKategoriler = loadFromDB('kys_categories', initialCategories);


// --- ID Counters ---
let nextIds = {
    uye: mockMembers.length > 0 ? Math.max(...mockMembers.map(m => m.uye_id)) + 1 : 1,
    personel: mockPersonel.length > 0 ? Math.max(...mockPersonel.map(p => p.personel_id)) + 1 : 1,
    kitap: mockKitaplar.length > 0 ? Math.max(...mockKitaplar.map(k => k.kitap_id)) + 1 : 1,
    odunc: mockOdunc.length > 0 ? Math.max(...mockOdunc.map(o => o.odunc_id)) + 1 : 1,
    // Kategori ID sayacını fonksiyon içinde dinamik hesaplayacağız
};

export const api = {
    
    // --- GİRİŞ (LOGIN) ---
    login(identifier, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Verileri tazele
                mockPersonel = loadFromDB('kys_staff', initialPersonel);
                mockMembers = loadFromDB('kys_members', initialMembers);

                // 1. Personel Kontrolü
                const personel = mockPersonel.find(p => p.kullanici_adi === identifier && p.sifre === password);
                if (personel) {
                    resolve({ 
                        id: personel.personel_id, 
                        ad: personel.personel_ad, 
                        soyad: personel.personel_soyad, 
                        yetki: personel.yetki, 
                        roleType: 'staff' 
                    });
                    return;
                }

                // 2. Üye Kontrolü
                const uye = mockMembers.find(m => m.uye_email === identifier && m.sifre === password);
                if (uye) {
                    resolve({ 
                        id: uye.uye_id, 
                        ad: uye.uye_ad, 
                        soyad: uye.uye_soyad, 
                        yetki: 'Uye', 
                        roleType: 'member',
                        uye_id: uye.uye_id, // Profil sayfası için
                        bakiye: uye.bakiye || 100 // Varsayılan bakiye
                    });
                    return;
                }

                resolve(false);
            }, delay);
        });
    },

    // --- KATEGORİ İŞLEMLERİ (Sorunsuz Version) ---
    getCategories: () => {
        return new Promise((resolve) => {
            // Direkt localStorage'dan taze çekiyoruz
            const raw = localStorage.getItem('kys_categories');
            // Eğer veri yoksa varsayılanı yükle
            const categories = raw ? JSON.parse(raw) : initialCategories;
            // Eğer ilk kez çalışıyorsa localStorage'a da yazalım ki sonraki silmeler tutarlı olsun
            if (!raw) saveToDB('kys_categories', categories);
            
            resolve(categories);
        });
    },

    addCategory: (veri) => {
        return new Promise((resolve, reject) => {
            // 1. En güncel listeyi al
            let categories = loadFromDB('kys_categories', initialCategories);

            // 2. İsim ayıklama (String mi Obje mi?)
            let kategAd = '';
            if (typeof veri === 'object' && veri !== null) {
                kategAd = veri.kategori_ad || veri.ad;
            } else {
                kategAd = veri;
            }

            if (!kategAd) return reject(new Error("Kategori adı boş olamaz."));

            // 3. ID Hesapla
            const maxId = categories.reduce((max, c) => (c.id > max ? c.id : max), 0);
            
            const newCat = { 
                id: maxId + 1, 
                kategori_ad: kategAd 
            };

            // 4. Ekle ve Kaydet
            categories.push(newCat);
            saveToDB('kys_categories', categories);
            resolve(newCat);
        });
    },

    deleteCategory: (id) => {
        return new Promise((resolve, reject) => {
            // 1. Verileri tazele
            let categories = loadFromDB('kys_categories', initialCategories);
            let books = loadFromDB('kys_books', initialBooks);

            const catIndex = categories.findIndex(c => c.id === id);
            if (catIndex === -1) return reject(new Error("Kategori bulunamadı."));

            // 2. Kitap Kontrolü
            // Not: Kitaplarda kategori ID'si "kategori_id" olarak geçiyor
            const booksInCategory = books.filter(b => b.kategori_id === id);
            if (booksInCategory.length > 0) {
                return reject(new Error(`Silinemez! Bu kategoride kayıtlı ${booksInCategory.length} adet kitap var.`));
            }

            // 3. Sil
            categories.splice(catIndex, 1);
            saveToDB('kys_categories', categories);
            
            resolve({ success: true, message: "Kategori silindi." });
        });
    },

    // --- KİTAP İŞLEMLERİ ---
    getBooks: () => Promise.resolve(loadFromDB('kys_books', initialBooks)),
    
    addBook: (kitap) => {
        return new Promise(resolve => {
            let books = loadFromDB('kys_books', initialBooks);
            const defaultImg = "https://via.placeholder.com/150x220?text=Kitap";
            
            // ID Hesapla
            const maxId = books.length > 0 ? Math.max(...books.map(k => k.kitap_id)) : 0;

            const newK = { 
                ...kitap, 
                kitap_id: maxId + 1,
                kitap_resim: kitap.kitap_resim || defaultImg
            };
            books.push(newK);
            saveToDB('kys_books', books);
            resolve(newK);
        });
    },

    deleteBook: (id) => {
        return new Promise((resolve) => {
            let books = loadFromDB('kys_books', initialBooks);
            books = books.filter(k => k.kitap_id !== id);
            saveToDB('kys_books', books);
            resolve({ success: true });
        });
    },

    // --- ÖDÜNÇ ve İADE İŞLEMLERİ ---
    getLoans: () => {
        return new Promise(resolve => {
            let loans = loadFromDB('kys_loans', []);
            const today = new Date();
            today.setHours(0,0,0,0);

            // Dinamik Ceza Hesaplama (Sadece görüntüleme için, veritabanına yazmaz)
            loans = loans.map(o => {
                if (o.odunc_durum) {
                    const iadeTarihi = new Date(o.odunc_iade_tarihi || o.iade_tarihi);
                    if (iadeTarihi < today) {
                        const diffTime = Math.abs(today - iadeTarihi);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        o.ceza = diffDays * FINE_PER_DAY;
                    } else {
                        o.ceza = 0;
                    }
                }
                return o;
            });
            resolve(loans);
        });
    },

    addLoan: (arg1, arg2, arg3, arg4) => {
        return new Promise((resolve, reject) => {
            let loans = loadFromDB('kys_loans', []);
            let books = loadFromDB('kys_books', initialBooks);
            
            let uye_id, kitap_id, alis, iade;

            // Parametre kontrolü (Obje mi, ayrı ayrı mı?)
            if (typeof arg1 === 'object' && arg1 !== null) {
                uye_id = arg1.uye_id;
                kitap_id = arg1.kitap_id;
                alis = arg1.odunc_tarihi;
                iade = arg1.iade_tarihi;
            } else {
                uye_id = arg1;
                kitap_id = arg2;
                alis = arg3;
                iade = arg4;
            }

            // Kitap ve Stok Kontrolü
            const kitapIndex = books.findIndex(k => k.kitap_id === kitap_id);
            if (kitapIndex === -1) return reject(new Error("Kitap bulunamadı!"));
            if (books[kitapIndex].kitap_stok <= 0) return reject(new Error("Stok Yok"));

            // ID Hesapla
            const maxLoanId = loans.length > 0 ? Math.max(...loans.map(o => o.odunc_id)) : 0;

            const newLoan = { 
                odunc_id: maxLoanId + 1, 
                uye_id: uye_id, 
                kitap_id: kitap_id, 
                odunc_alma_tarihi: alis || new Date().toISOString().split('T')[0],
                odunc_iade_tarihi: iade, 
                odunc_durum: true, 
                ceza: 0, 
                odeme_durumu: false
            };

            loans.push(newLoan);
            books[kitapIndex].kitap_stok--; // Stok düş
            
            saveToDB('kys_loans', loans);
            saveToDB('kys_books', books);
            
            resolve(newLoan);
        });
    },

    // Normal İade İşlemi (Cezasız veya personelin manuel iadesi)
    returnLoan: (id) => {
        return new Promise((resolve) => {
            let loans = loadFromDB('kys_loans', []);
            let books = loadFromDB('kys_books', initialBooks);

            let idx = loans.findIndex(o => o.odunc_id === id);
            if(idx > -1) {
                loans[idx].odunc_durum = false; // İade edildi
                
                // Stok artır
                let kIdx = books.findIndex(k => k.kitap_id === loans[idx].kitap_id);
                if(kIdx > -1) books[kIdx].kitap_stok++;
                
                saveToDB('kys_loans', loans);
                saveToDB('kys_books', books);
                resolve({success: true, message: "İade alındı"});
            }
        });
    },

    // Ceza Ödeme ve Otomatik İade
    payFine: (odunc_id, tutar) => {
        return new Promise((resolve, reject) => {
            let loans = loadFromDB('kys_loans', []);
            let books = loadFromDB('kys_books', initialBooks);
            
            const loanIndex = loans.findIndex(l => l.odunc_id === odunc_id);
            if (loanIndex === -1) return reject(new Error("Kayıt bulunamadı."));

            const loan = loans[loanIndex];

            // Ödeme bilgilerini işle
            loan.ceza_odenen = (loan.ceza_odenen || 0) + tutar;
            loan.odeme_tarihi = new Date().toISOString().split('T')[0];
            loan.odeme_yapildi = true; 
            
            // --- KRİTİK: Ödeme yapılınca kitap iade alınmış sayılır ---
            loan.odunc_durum = false; 
            loan.odunc_iade_tarihi = new Date().toISOString().split('T')[0];

            // Stok artır
            const kitap = books.find(k => k.kitap_id === loan.kitap_id);
            if (kitap) {
                kitap.kitap_stok++;
                saveToDB('kys_books', books);
            }

            saveToDB('kys_loans', loans);
            
            resolve({ success: true, message: `Ödeme alındı ve kitap iade edildi.` });
        });
    },

    // --- ÜYE İŞLEMLERİ ---
    getMembers: () => Promise.resolve(loadFromDB('kys_members', initialMembers)),
    registerMember: (uyeData) => {
        return new Promise((resolve) => {
            let members = loadFromDB('kys_members', initialMembers);
            const maxId = members.length > 0 ? Math.max(...members.map(m => m.uye_id)) : 0;
            
            const newUye = { 
                ...uyeData, 
                uye_id: maxId + 1,
                uye_kayit_tarihi: new Date().toISOString().split('T')[0]
            };
            members.push(newUye);
            saveToDB('kys_members', members);
            resolve(newUye);
        });
    },
    deleteMember: (id) => {
        return new Promise((resolve) => {
            let members = loadFromDB('kys_members', initialMembers);
            members = members.filter(m => m.uye_id !== id);
            saveToDB('kys_members', members);
            resolve({ success: true });
        });
    },

    // --- PERSONEL İŞLEMLERİ ---
    getStaff: () => Promise.resolve(loadFromDB('kys_staff', initialPersonel)),
    addStaff: (p) => {
        return new Promise(resolve => {
            let staff = loadFromDB('kys_staff', initialPersonel);
            const maxId = staff.length > 0 ? Math.max(...staff.map(s => s.personel_id)) : 0;
            const newP = { ...p, personel_id: maxId + 1 };
            staff.push(newP);
            saveToDB('kys_staff', staff);
            resolve(newP);
        });
    },
    deleteStaff: (id) => {
        return new Promise(resolve => {
            let staff = loadFromDB('kys_staff', initialPersonel);
            staff = staff.filter(p => p.personel_id !== id);
            saveToDB('kys_staff', staff);
            resolve({success: true});
        });
    }
};