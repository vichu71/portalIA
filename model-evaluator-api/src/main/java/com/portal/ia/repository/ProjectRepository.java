package com.portal.ia.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.portal.ia.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    Optional<Project> findByName(String name);
    void deleteByName(String name);

    @Query("SELECT p FROM Project p WHERE " +
           "(:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<Project> findByFilters(@Param("name") String name, Pageable pageable);
    
    @EntityGraph(attributePaths = {"environments", "environments.server"})
    Optional<Project> findById(Long id);
}
