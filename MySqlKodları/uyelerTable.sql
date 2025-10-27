create table kutuphaneyonetimsistemi.uyeler(
	uye_id int auto_increment primary key,
    uye_ad varchar(50) not null,
    uye_soyad varchar(50) not null,
    uye_telefon varchar(11),
    uye_email varchar(100) not null,
    uye_kayıt_tarihi date not null
);