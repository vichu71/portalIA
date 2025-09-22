package com.portal.ia.controller;

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

import com.portal.ia.entity.Task;
import com.portal.ia.service.TaskService;

// DTO para recibir datos del frontend
class TaskCreateRequest {
    private String title;
    private String description;
    private String priority;
    private String status;
    private String dueDate;
    private String assignedTo;
    private Long projectId;
    
    // Getters y setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<Page<Task>> getAllTasks(
            Pageable pageable,
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "description", required = false) String description,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "priority", required = false) String priority,
            @RequestParam(name = "assignedTo", required = false) String assignedTo,
            @RequestParam(name = "projectId", required = false) Long projectId,
            @RequestParam(name = "orderBy", defaultValue = "updatedAt") String orderBy,
            @RequestParam(name = "isOrderDesc", defaultValue = "true") boolean isOrderDesc) {
        
        Page<Task> result = taskService.getTasksByFilters(
            title, description, status, priority, assignedTo, projectId, orderBy, isOrderDesc, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/list")
    public ResponseEntity<List<Task>> list() {
        return ResponseEntity.ok(taskService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskDetails(@PathVariable("id") Long id) {
        Optional<Task> optionalTask = taskService.getById(id);
        if (optionalTask.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(optionalTask.get());
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskCreateRequest request) {
        try {
            // Crear objeto Task a partir del request
            Task task = new Task();
            task.setTitle(request.getTitle());
            task.setDescription(request.getDescription());
            task.setPriority(request.getPriority());
            task.setStatus(request.getStatus());
            task.setAssignedTo(request.getAssignedTo());
            
            // Manejar fecha si viene
            if (request.getDueDate() != null && !request.getDueDate().isEmpty()) {
                task.setDueDate(java.time.LocalDate.parse(request.getDueDate()));
            }

            // Usar el método que maneja el projectId correctamente
            Task createdTask = taskService.createWithProjectId(task, request.getProjectId());
            return ResponseEntity.ok(createdTask);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable("id") Long id,
            @RequestBody TaskCreateRequest request) {
        try {
            // Crear objeto Task a partir del request
            Task taskData = new Task();
            taskData.setTitle(request.getTitle());
            taskData.setDescription(request.getDescription());
            taskData.setPriority(request.getPriority());
            taskData.setStatus(request.getStatus());
            taskData.setAssignedTo(request.getAssignedTo());
            
            // Manejar fecha si viene
            if (request.getDueDate() != null && !request.getDueDate().isEmpty()) {
                taskData.setDueDate(java.time.LocalDate.parse(request.getDueDate()));
            }

            Task updatedTask = taskService.update(id, taskData);
            
            // Si hay projectId, asignar el proyecto
            if (request.getProjectId() != null) {
                updatedTask = taskService.assignToProject(id, request.getProjectId());
            }
            
            return ResponseEntity.ok(updatedTask);
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
    public ResponseEntity<?> deleteTask(@PathVariable("id") Long id) {
        try {
            taskService.deleteById(id);
            return ResponseEntity.noContent().build(); // 204 sin contenido
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    // Endpoints específicos por filtros
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Task>> getTasksByStatus(@PathVariable("status") String status) {
        List<Task> tasks = taskService.getByStatus(status);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Task>> getTasksByPriority(@PathVariable("priority") String priority) {
        List<Task> tasks = taskService.getByPriority(priority);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/assignedTo/{assignedTo}")
    public ResponseEntity<List<Task>> getTasksByAssignedTo(@PathVariable("assignedTo") String assignedTo) {
        List<Task> tasks = taskService.getByAssignedTo(assignedTo);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable("projectId") Long projectId) {
        List<Task> tasks = taskService.getByProjectId(projectId);
        return ResponseEntity.ok(tasks);
    }

    // Endpoint para estadísticas
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTaskStats() {
        Map<String, Object> stats = taskService.getTaskStats();
        return ResponseEntity.ok(stats);
    }

    // Endpoint para asignar tarea a proyecto
    @PutMapping("/{taskId}/assign-project/{projectId}")
    public ResponseEntity<?> assignTaskToProject(
            @PathVariable("taskId") Long taskId,
            @PathVariable("projectId") Long projectId) {
        try {
            Task updatedTask = taskService.assignToProject(taskId, projectId);
            return ResponseEntity.ok(updatedTask);
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    // Endpoint para desasignar tarea de proyecto
    @PutMapping("/{taskId}/unassign-project")
    public ResponseEntity<?> unassignTaskFromProject(@PathVariable("taskId") Long taskId) {
        try {
            Task updatedTask = taskService.unassignFromProject(taskId);
            return ResponseEntity.ok(updatedTask);
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }
}