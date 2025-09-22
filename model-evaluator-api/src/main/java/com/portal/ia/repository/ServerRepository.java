package com.portal.ia.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.portal.ia.entity.Server;

public interface ServerRepository extends JpaRepository<Server, Long> {
    
    Optional<Server> findByName(String name);
    void deleteByName(String name);

    @Query("SELECT p FROM Server p WHERE " +
           "(:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<Server> findByFilters(@Param("name") String name, Pageable pageable);
}
