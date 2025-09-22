package com.portal.ia.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.portal.ia.entity.DailyNote;
import com.portal.ia.service.DailyNoteService;

// DTO para recibir datos del frontend
class DailyNoteRequest {
    private String date;
    private String content;
    
    // Getters y setters
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}

// DTO para el método createOrUpdate
class DailyNoteCreateOrUpdateRequest {
    private String date;
    private String content;
    
    // Getters y setters
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}

@RestController
@RequestMapping("/api/daily-notes")
@CrossOrigin
public class DailyNoteController {

    private final DailyNoteService dailyNoteService;

    @Autowired
    public DailyNoteController(DailyNoteService dailyNoteService) {
        this.dailyNoteService = dailyNoteService;
    }

    @GetMapping
    public ResponseEntity<Page<DailyNote>> getAllDailyNotes(
            Pageable pageable,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate,
            @RequestParam(name = "content", required = false) String content,
            @RequestParam(name = "orderBy", defaultValue = "date") String orderBy,
            @RequestParam(name = "isOrderDesc", defaultValue = "true") boolean isOrderDesc) {
        
        LocalDate parsedStartDate = null;
        LocalDate parsedEndDate = null;
        
        try {
            if (startDate != null && !startDate.isEmpty()) {
                parsedStartDate = LocalDate.parse(startDate);
            }
            if (endDate != null && !endDate.isEmpty()) {
                parsedEndDate = LocalDate.parse(endDate);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        
        Page<DailyNote> result = dailyNoteService.getNotesByFilters(
            parsedStartDate, parsedEndDate, content, orderBy, isOrderDesc, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/list")
    public ResponseEntity<List<DailyNote>> list() {
        return ResponseEntity.ok(dailyNoteService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DailyNote> getDailyNoteDetails(@PathVariable("id") Long id) {
        Optional<DailyNote> optionalNote = dailyNoteService.getById(id);
        if (optionalNote.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(optionalNote.get());
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<DailyNote> getDailyNoteByDate(@PathVariable("date") String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            Optional<DailyNote> optionalNote = dailyNoteService.getByDate(date);
            if (optionalNote.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(optionalNote.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createDailyNote(@RequestBody DailyNoteRequest request) {
        try {
            // Crear objeto DailyNote a partir del request
            DailyNote dailyNote = new DailyNote();
            dailyNote.setContent(request.getContent());
            
            // Manejar fecha
            if (request.getDate() != null && !request.getDate().isEmpty()) {
                dailyNote.setDate(LocalDate.parse(request.getDate()));
            }

            DailyNote createdNote = dailyNoteService.create(dailyNote);
            return ResponseEntity.ok(createdNote);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    @PostMapping("/create-or-update")
    public ResponseEntity<?> createOrUpdateDailyNote(@RequestBody DailyNoteCreateOrUpdateRequest request) {
        try {
            if (request.getDate() == null || request.getDate().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "La fecha es obligatoria"));
            }

            LocalDate date = LocalDate.parse(request.getDate());
            String content = request.getContent() != null ? request.getContent() : "";
            
            DailyNote result = dailyNoteService.createOrUpdate(date, content);
            
            if (result == null) {
                // Nota eliminada porque el contenido estaba vacío
                return ResponseEntity.ok(Map.of("message", "Nota eliminada correctamente"));
            } else {
                return ResponseEntity.ok(result);
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDailyNote(
            @PathVariable("id") Long id,
            @RequestBody DailyNoteRequest request) {
        try {
            // Crear objeto DailyNote a partir del request
            DailyNote noteData = new DailyNote();
            noteData.setContent(request.getContent());
            
            // Manejar fecha si viene
            if (request.getDate() != null && !request.getDate().isEmpty()) {
                noteData.setDate(LocalDate.parse(request.getDate()));
            }

            DailyNote updatedNote = dailyNoteService.update(id, noteData);
            return ResponseEntity.ok(updatedNote);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    @PutMapping("/date/{date}")
    public ResponseEntity<?> updateDailyNoteByDate(
            @PathVariable("date") String dateStr,
            @RequestBody DailyNoteRequest request) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            
            if (request.getContent() == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El contenido es obligatorio"));
            }

            DailyNote updatedNote = dailyNoteService.updateByDate(date, request.getContent());
            return ResponseEntity.ok(updatedNote);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDailyNote(@PathVariable("id") Long id) {
        try {
            dailyNoteService.deleteById(id);
            return ResponseEntity.noContent().build(); // 204 sin contenido
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    @DeleteMapping("/date/{date}")
    public ResponseEntity<?> deleteDailyNoteByDate(@PathVariable("date") String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            boolean deleted = dailyNoteService.deleteByDate(date);
            
            if (deleted) {
                return ResponseEntity.noContent().build(); // 204 sin contenido
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    // Endpoints específicos por filtros temporales
    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<List<DailyNote>> getDailyNotesByMonth(
            @PathVariable("year") int year,
            @PathVariable("month") int month) {
        try {
            List<DailyNote> notes = dailyNoteService.getByMonth(year, month);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(null);
        }
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<List<DailyNote>> getDailyNotesByYear(@PathVariable("year") int year) {
        try {
            List<DailyNote> notes = dailyNoteService.getByYear(year);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(null);
        }
    }

    @GetMapping("/current-month")
    public ResponseEntity<List<DailyNote>> getCurrentMonthNotes() {
        List<DailyNote> notes = dailyNoteService.getCurrentMonthNotes();
        return ResponseEntity.ok(notes);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<DailyNote>> getDailyNotesByDateRange(
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr) {
        try {
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);
            
            List<DailyNote> notes = dailyNoteService.getByDateRange(startDate, endDate);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(null);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<DailyNote>> searchDailyNotesByContent(
            @RequestParam("content") String content) {
        List<DailyNote> notes = dailyNoteService.searchByContent(content);
        return ResponseEntity.ok(notes);
    }

    @GetMapping("/exists/{date}")
    public ResponseEntity<Map<String, Boolean>> checkIfNoteExists(@PathVariable("date") String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            boolean exists = dailyNoteService.existsForDate(date);
            return ResponseEntity.ok(Map.of("exists", exists));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("exists", false));
        }
    }

    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getDailyNotesMapForDateRange(
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr) {
        try {
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);
            
            Map<LocalDate, String> notesMap = dailyNoteService.getNotesMapForDateRange(startDate, endDate);
            
            // Convertir LocalDate a String para JSON
            Map<String, String> stringMap = new java.util.HashMap<>();
            notesMap.forEach((date, content) -> stringMap.put(date.toString(), content));
            
            return ResponseEntity.ok(stringMap);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new java.util.HashMap<>());
        }
    }

    // Endpoint para estadísticas
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDailyNoteStats() {
        Map<String, Object> stats = dailyNoteService.getNoteStats();
        return ResponseEntity.ok(stats);
    }
}