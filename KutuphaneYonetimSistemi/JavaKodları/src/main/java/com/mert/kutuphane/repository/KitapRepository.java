package com.mert.kutuphane.repository;
import com.mert.kutuphane.model.Kitap;
import org.springframework.data.jpa.repository.JpaRepository;
public interface KitapRepository extends JpaRepository<Kitap, Integer> { }