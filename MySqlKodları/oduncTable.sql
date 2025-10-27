create table kutuphaneyonetimsistemi.odunc(
	odunc_id int auto_increment,
    odunc_tarihi date not null,
    iade_tarihi date not null,
    durum varchar(20),
    uye_id int,
    ktp_id int,
    primary key(odunc_id,uye_id,ktp_id),
    foreign key(ktp_id)
		references kitaplar(ktp_id)
        on update restrict
        on delete cascade,
	foreign key(uye_id)
		references uyeler(uye_id)
		on update restrict
        on delete cascade
);