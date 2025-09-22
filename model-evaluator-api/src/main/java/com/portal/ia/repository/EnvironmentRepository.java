package com.portal.ia.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.portal.ia.entity.Environment;
import com.portal.ia.entity.Project;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
    
    Optional<Environment> findByType(String type);
    void deleteById(Long id);

    @Query("SELECT p FROM Environment p WHERE " +
           "(:type IS NULL OR LOWER(p.type) LIKE LOWER(CONCAT('%', :type, '%')))")
    Page<Environment> findByFilters(@Param("type") String type, Pageable pageable);
}
