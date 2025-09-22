package com.portal.ia.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.portal.ia.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {
    
    Optional<Task> findByTitle(String title);
    
    // Cambiado para usar la sintaxis correcta de Spring Data JPA
    List<Task> findByProject_Id(Long projectId);
    
    List<Task> findByStatus(String status);
    
    List<Task> findByPriority(String priority);
    
    List<Task> findByAssignedTo(String assignedTo);

    @Query("SELECT t FROM Task t WHERE " +
           "(:title IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "(:description IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :description, '%'))) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:assignedTo IS NULL OR LOWER(t.assignedTo) LIKE LOWER(CONCAT('%', :assignedTo, '%'))) AND " +
           "(:projectId IS NULL OR t.project.id = :projectId)")
    Page<Task> findByFilters(
        @Param("title") String title,
        @Param("description") String description,
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("assignedTo") String assignedTo,
        @Param("projectId") Long projectId,
        Pageable pageable
    );

    @Query("SELECT COUNT(t) FROM Task t WHERE t.status = :status")
    Long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.priority = :priority")
    Long countByPriority(@Param("priority") String priority);

    // Este método ya usa la query personalizada correcta
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId")
    List<Task> findTasksByProjectId(@Param("projectId") Long projectId);
}