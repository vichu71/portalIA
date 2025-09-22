package com.portal.ia.service;

import com.portal.ia.entity.Project;
import com.portal.ia.repository.ProjectRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.EntityNotFoundException;

@Service
public class ProjectService {

    private final ProjectRepository repository;
    private final ReadmeSyncService readmeSyncService;

    public ProjectService(ProjectRepository repository, ReadmeSyncService readmeSyncService) {
        this.repository = repository;
        this.readmeSyncService = readmeSyncService;
    }

    public List<Project> getAll() {
        return repository.findAll();
    }

    public Optional<Project> getById(Long id) {
        return repository.findById(id);
    }

    public Optional<Project> getByName(String name) {
        return repository.findByName(name);
    }

    public Page<Project> getProjectsByFilters(String name, String orderBy, boolean isOrderDesc, Pageable pageable) {
        Sort sort = isOrderDesc ? Sort.by(orderBy).descending() : Sort.by(orderBy).ascending();
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        return repository.findByFilters(name, sortedPageable);
    }

    public Project save(Project project) {
        Project saved = repository.save(project);
        readmeSyncService.sync(saved);
        return saved;
    }

    public boolean deleteByName(String name) {
        Optional<Project> opt = repository.findByName(name);
        if (opt.isPresent()) {
            repository.delete(opt.get());
            return true;
        }
        return false;
    }

    public void deleteById(Long id) {
        Optional<Project> opt = repository.findById(id);
        if (opt.isEmpty()) {
            throw new EntityNotFoundException("Proyecto con ID " + id + " no encontrado.");
        }

        Project project = opt.get();  // 👈 lo recuperas ANTES de borrar

        // Primero eliminar el README
        readmeSyncService.eliminarReadme(project);  // 👈 pásale el objeto, no solo el ID

        // Luego eliminar el proyecto de la BBDD
        repository.deleteById(id);
    }


	
} 
