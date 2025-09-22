package com.portal.ia.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.portal.ia.entity.DailyNote;

public interface DailyNoteRepository extends JpaRepository<DailyNote, Long> {
    
    Optional<DailyNote> findByDate(LocalDate date);
    
    List<DailyNote> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<DailyNote> findByContentContainingIgnoreCase(String content);
    
    @Query("SELECT d FROM DailyNote d WHERE " +
           "(:startDate IS NULL OR d.date >= :startDate) AND " +
           "(:endDate IS NULL OR d.date <= :endDate) AND " +
           "(:content IS NULL OR LOWER(d.content) LIKE LOWER(CONCAT('%', :content, '%')))")
    Page<DailyNote> findByFilters(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("content") String content,
        Pageable pageable
    );

    @Query("SELECT COUNT(d) FROM DailyNote d WHERE d.date BETWEEN :startDate AND :endDate")
    Long countByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT d FROM DailyNote d WHERE YEAR(d.date) = :year AND MONTH(d.date) = :month ORDER BY d.date ASC")
    List<DailyNote> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT d FROM DailyNote d WHERE YEAR(d.date) = :year ORDER BY d.date ASC")
    List<DailyNote> findByYear(@Param("year") int year);

    boolean existsByDate(LocalDate date);
}