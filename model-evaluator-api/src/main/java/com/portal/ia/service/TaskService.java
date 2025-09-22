package com.portal.ia.service;

import com.portal.ia.entity.Task;
import com.portal.ia.entity.Project;
import com.portal.ia.repository.TaskRepository;
import com.portal.ia.repository.ProjectRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;
import jakarta.persistence.EntityNotFoundException;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    public List<Task> getAll() {
        return taskRepository.findAll();
    }

    public Optional<Task> getById(Long id) {
        return taskRepository.findById(id);
    }

    public Optional<Task> getByTitle(String title) {
        return taskRepository.findByTitle(title);
    }

    public List<Task> getByProjectId(Long projectId) {
        return taskRepository.findByProject_Id(projectId);
    }

    public List<Task> getByStatus(String status) {
        return taskRepository.findByStatus(status);
    }

    public List<Task> getByPriority(String priority) {
        return taskRepository.findByPriority(priority);
    }

    public List<Task> getByAssignedTo(String assignedTo) {
        return taskRepository.findByAssignedTo(assignedTo);
    }

    public Page<Task> getTasksByFilters(
            String title, 
            String description, 
            String status, 
            String priority, 
            String assignedTo, 
            Long projectId,
            String orderBy, 
            boolean isOrderDesc, 
            Pageable pageable) {
        
        Sort sort = isOrderDesc ? Sort.by(orderBy).descending() : Sort.by(orderBy).ascending();
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        return taskRepository.findByFilters(title, description, status, priority, assignedTo, projectId, sortedPageable);
    }

    public Task save(Task task) {
        // Validaciones básicas
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("El título es obligatorio");
        }
        if (task.getDescription() == null || task.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("La descripción es obligatoria");
        }
        if (task.getPriority() == null || (!task.getPriority().equals("alta") && 
            !task.getPriority().equals("media") && !task.getPriority().equals("baja"))) {
            throw new IllegalArgumentException("La prioridad debe ser 'alta', 'media' o 'baja'");
        }
        if (task.getStatus() == null || (!task.getStatus().equals("pendiente") && 
            !task.getStatus().equals("en_progreso") && !task.getStatus().equals("completada"))) {
            throw new IllegalArgumentException("El estado debe ser 'pendiente', 'en_progreso' o 'completada'");
        }

        return taskRepository.save(task);
    }

    public Task create(Task task) {
        if (task.getId() != null) {
            throw new IllegalArgumentException("No se puede especificar ID al crear una nueva tarea");
        }
        return save(task);
    }

    public Task createWithProjectId(Task task, Long projectId) {
        if (task.getId() != null) {
            throw new IllegalArgumentException("No se puede especificar ID al crear una nueva tarea");
        }
        
        // Si se proporciona un projectId, cargar el proyecto y asignarlo
        if (projectId != null) {
            Optional<Project> optionalProject = projectRepository.findById(projectId);
            if (optionalProject.isEmpty()) {
                throw new EntityNotFoundException("Proyecto con ID " + projectId + " no encontrado.");
            }
            task.setProject(optionalProject.get());
        }
        
        return save(task);
    }

    public Task update(Long id, Task updatedTaskData) {
        Optional<Task> optionalTask = taskRepository.findById(id);
        if (optionalTask.isEmpty()) {
            throw new EntityNotFoundException("Tarea con ID " + id + " no encontrada.");
        }

        Task existingTask = optionalTask.get();
        
        // Actualizar solo los campos que no son null
        if (updatedTaskData.getTitle() != null) {
            existingTask.setTitle(updatedTaskData.getTitle());
        }
        if (updatedTaskData.getDescription() != null) {
            existingTask.setDescription(updatedTaskData.getDescription());
        }
        if (updatedTaskData.getPriority() != null) {
            existingTask.setPriority(updatedTaskData.getPriority());
        }
        if (updatedTaskData.getStatus() != null) {
            existingTask.setStatus(updatedTaskData.getStatus());
        }
        if (updatedTaskData.getDueDate() != null) {
            existingTask.setDueDate(updatedTaskData.getDueDate());
        }
        if (updatedTaskData.getAssignedTo() != null) {
            existingTask.setAssignedTo(updatedTaskData.getAssignedTo());
        }
        if (updatedTaskData.getProject() != null) {
            existingTask.setProject(updatedTaskData.getProject());
        }

        return save(existingTask);
    }

    public void deleteById(Long id) {
        Optional<Task> optionalTask = taskRepository.findById(id);
        if (optionalTask.isEmpty()) {
            throw new EntityNotFoundException("Tarea con ID " + id + " no encontrada.");
        }
        taskRepository.deleteById(id);
    }

    public boolean deleteByTitle(String title) {
        Optional<Task> optionalTask = taskRepository.findByTitle(title);
        if (optionalTask.isPresent()) {
            taskRepository.delete(optionalTask.get());
            return true;
        }
        return false;
    }

    public Map<String, Object> getTaskStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Estadísticas por estado
        stats.put("total", taskRepository.count());
        stats.put("pendientes", taskRepository.countByStatus("pendiente"));
        stats.put("en_progreso", taskRepository.countByStatus("en_progreso"));
        stats.put("completadas", taskRepository.countByStatus("completada"));
        
        // Estadísticas por prioridad
        Map<String, Long> porPrioridad = new HashMap<>();
        porPrioridad.put("alta", taskRepository.countByPriority("alta"));
        porPrioridad.put("media", taskRepository.countByPriority("media"));
        porPrioridad.put("baja", taskRepository.countByPriority("baja"));
        stats.put("por_prioridad", porPrioridad);
        
        return stats;
    }

    public Task assignToProject(Long taskId, Long projectId) {
        Optional<Task> optionalTask = taskRepository.findById(taskId);
        if (optionalTask.isEmpty()) {
            throw new EntityNotFoundException("Tarea con ID " + taskId + " no encontrada.");
        }

        Optional<Project> optionalProject = projectRepository.findById(projectId);
        if (optionalProject.isEmpty()) {
            throw new EntityNotFoundException("Proyecto con ID " + projectId + " no encontrado.");
        }

        Task task = optionalTask.get();
        Project project = optionalProject.get();
        task.setProject(project);

        return taskRepository.save(task);
    }

    public Task unassignFromProject(Long taskId) {
        Optional<Task> optionalTask = taskRepository.findById(taskId);
        if (optionalTask.isEmpty()) {
            throw new EntityNotFoundException("Tarea con ID " + taskId + " no encontrada.");
        }

        Task task = optionalTask.get();
        task.setProject(null);

        return taskRepository.save(task);
    }
}