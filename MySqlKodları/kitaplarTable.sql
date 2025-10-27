
create table kutuphaneyonetimsistemi.kitaplar(
	ktp_id int auto_increment,
    kategori_id int,
    ktp_ad varchar(100) not null,
    yazar varchar(100),
    yayin_yili date,
    ktp_stok int not null,
    durum varchar(20) not null,
    primary key(ktp_id , kategori_id),
    foreign key(kategori_id)
		references kategoriler(kategori_id)
		on update restrict
        on delete cascade
);
