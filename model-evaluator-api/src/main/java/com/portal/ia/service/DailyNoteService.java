package com.portal.ia.service;

import com.portal.ia.entity.DailyNote;
import com.portal.ia.repository.DailyNoteRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class DailyNoteService {

    private final DailyNoteRepository dailyNoteRepository;

    public DailyNoteService(DailyNoteRepository dailyNoteRepository) {
        this.dailyNoteRepository = dailyNoteRepository;
    }

    public List<DailyNote> getAll() {
        return dailyNoteRepository.findAll();
    }

    public Optional<DailyNote> getById(Long id) {
        return dailyNoteRepository.findById(id);
    }

    public Optional<DailyNote> getByDate(LocalDate date) {
        return dailyNoteRepository.findByDate(date);
    }

    public List<DailyNote> getByDateRange(LocalDate startDate, LocalDate endDate) {
        return dailyNoteRepository.findByDateBetween(startDate, endDate);
    }

    public List<DailyNote> getByMonth(int year, int month) {
        return dailyNoteRepository.findByYearAndMonth(year, month);
    }

    public List<DailyNote> getByYear(int year) {
        return dailyNoteRepository.findByYear(year);
    }

    public List<DailyNote> searchByContent(String content) {
        return dailyNoteRepository.findByContentContainingIgnoreCase(content);
    }

    public Page<DailyNote> getNotesByFilters(
            LocalDate startDate,
            LocalDate endDate,
            String content,
            String orderBy,
            boolean isOrderDesc,
            Pageable pageable) {
        
        Sort sort = isOrderDesc ? Sort.by(orderBy).descending() : Sort.by(orderBy).ascending();
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        return dailyNoteRepository.findByFilters(startDate, endDate, content, sortedPageable);
    }

    public DailyNote save(DailyNote dailyNote) {
        // Validaciones básicas
        if (dailyNote.getDate() == null) {
            throw new IllegalArgumentException("La fecha es obligatoria");
        }
        if (dailyNote.getContent() == null || dailyNote.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("El contenido es obligatorio");
        }

        // Validar que el contenido tenga un mínimo de caracteres
        if (dailyNote.getContent().trim().length() < 3) {
            throw new IllegalArgumentException("El contenido debe tener al menos 3 caracteres");
        }

        try {
            return dailyNoteRepository.save(dailyNote);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Ya existe una nota para la fecha " + dailyNote.getDate());
        }
    }

    public DailyNote create(DailyNote dailyNote) {
        if (dailyNote.getId() != null) {
            throw new IllegalArgumentException("No se puede especificar ID al crear una nueva nota diaria");
        }

        // Verificar si ya existe una nota para esa fecha
        if (dailyNoteRepository.existsByDate(dailyNote.getDate())) {
            throw new IllegalArgumentException("Ya existe una nota para la fecha " + dailyNote.getDate());
        }

        return save(dailyNote);
    }

    public DailyNote createOrUpdate(LocalDate date, String content) {
        // Trimear el contenido
        String trimmedContent = content.trim();
        
        // Si el contenido está vacío, eliminar la nota si existe
        if (trimmedContent.isEmpty()) {
            Optional<DailyNote> existingNote = dailyNoteRepository.findByDate(date);
            if (existingNote.isPresent()) {
                dailyNoteRepository.delete(existingNote.get());
            }
            return null; // Nota eliminada
        }

        // Buscar nota existente
        Optional<DailyNote> existingNote = dailyNoteRepository.findByDate(date);
        
        if (existingNote.isPresent()) {
            // Actualizar nota existente
            DailyNote note = existingNote.get();
            note.setContent(trimmedContent);
            return save(note);
        } else {
            // Crear nueva nota
            DailyNote newNote = new DailyNote();
            newNote.setDate(date);
            newNote.setContent(trimmedContent);
            return save(newNote);
        }
    }

    public DailyNote update(Long id, DailyNote updatedNoteData) {
        Optional<DailyNote> optionalNote = dailyNoteRepository.findById(id);
        if (optionalNote.isEmpty()) {
            throw new EntityNotFoundException("Nota diaria con ID " + id + " no encontrada.");
        }

        DailyNote existingNote = optionalNote.get();
        
        // Actualizar solo los campos que no son null
        if (updatedNoteData.getContent() != null) {
            existingNote.setContent(updatedNoteData.getContent());
        }
        if (updatedNoteData.getDate() != null) {
            // Verificar que no se duplique la fecha con otra nota
            if (!existingNote.getDate().equals(updatedNoteData.getDate())) {
                if (dailyNoteRepository.existsByDate(updatedNoteData.getDate())) {
                    throw new IllegalArgumentException("Ya existe una nota para la fecha " + updatedNoteData.getDate());
                }
                existingNote.setDate(updatedNoteData.getDate());
            }
        }

        return save(existingNote);
    }

    public DailyNote updateByDate(LocalDate date, String content) {
        Optional<DailyNote> optionalNote = dailyNoteRepository.findByDate(date);
        if (optionalNote.isEmpty()) {
            throw new EntityNotFoundException("Nota diaria para la fecha " + date + " no encontrada.");
        }

        DailyNote existingNote = optionalNote.get();
        existingNote.setContent(content.trim());

        return save(existingNote);
    }

    public void deleteById(Long id) {
        Optional<DailyNote> optionalNote = dailyNoteRepository.findById(id);
        if (optionalNote.isEmpty()) {
            throw new EntityNotFoundException("Nota diaria con ID " + id + " no encontrada.");
        }
        dailyNoteRepository.deleteById(id);
    }

    public boolean deleteByDate(LocalDate date) {
        Optional<DailyNote> optionalNote = dailyNoteRepository.findByDate(date);
        if (optionalNote.isPresent()) {
            dailyNoteRepository.delete(optionalNote.get());
            return true;
        }
        return false;
    }

    public Map<String, Object> getNoteStats() {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate startOfYear = now.withDayOfYear(1);
        LocalDate startOfWeek = now.minusDays(now.getDayOfWeek().getValue() - 1);

        // Estadísticas generales
        stats.put("total", dailyNoteRepository.count());
        stats.put("este_mes", dailyNoteRepository.countByDateBetween(startOfMonth, now));
        stats.put("este_año", dailyNoteRepository.countByDateBetween(startOfYear, now));
        stats.put("esta_semana", dailyNoteRepository.countByDateBetween(startOfWeek, now));
        
        // Promedio de caracteres (si queremos implementar esto)
        List<DailyNote> allNotes = dailyNoteRepository.findAll();
        if (!allNotes.isEmpty()) {
            double avgLength = allNotes.stream()
                .mapToInt(note -> note.getContent().length())
                .average()
                .orElse(0.0);
            stats.put("promedio_caracteres", Math.round(avgLength));
        } else {
            stats.put("promedio_caracteres", 0);
        }

        return stats;
    }

    public boolean existsForDate(LocalDate date) {
        return dailyNoteRepository.existsByDate(date);
    }

    public List<DailyNote> getCurrentMonthNotes() {
        LocalDate now = LocalDate.now();
        return getByMonth(now.getYear(), now.getMonthValue());
    }

    public Map<LocalDate, String> getNotesMapForDateRange(LocalDate startDate, LocalDate endDate) {
        List<DailyNote> notes = getByDateRange(startDate, endDate);
        Map<LocalDate, String> notesMap = new HashMap<>();
        
        for (DailyNote note : notes) {
            notesMap.put(note.getDate(), note.getContent());
        }
        
        return notesMap;
    }
}