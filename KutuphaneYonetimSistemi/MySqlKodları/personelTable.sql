create table kutuphaneyonetimsistemi.personel(
	personel_id int auto_increment primary key,
    personel_ad varchar(50) not null,
    personel_soyad varchar(50) not null,
    kullanici_adi varchar(50) not null,
    sifre varchar(100) not null,
    yetki varchar(20) not null
);