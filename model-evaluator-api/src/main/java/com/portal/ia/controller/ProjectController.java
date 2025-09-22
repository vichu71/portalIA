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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.portal.ia.entity.Project;
import com.portal.ia.service.ProjectService;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin
public class ProjectController {

	private final ProjectService projectService;

    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<Page<Project>> getAllProjects(
            Pageable pageable,
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "orderBy", defaultValue = "name") String orderBy,
            @RequestParam(name = "isOrderDesc", defaultValue = "false") boolean isOrderDesc) {
        
        Page<Project> result = projectService.getProjectsByFilters(name, orderBy, isOrderDesc, pageable);
        return ResponseEntity.ok(result);
    }


    @GetMapping("/list")
    public ResponseEntity<List<Project>> list() {
        return ResponseEntity.ok(projectService.getAll());
    }

	    @PostMapping
	    public ResponseEntity<Project> createProject(@RequestBody Project project) {
	        if (project.getId() != null) {
	            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
	        }
	
	        project.setEnvironments(null); // fuerza que no se creen entornos aquí
	        return ResponseEntity.ok(projectService.save(project));
	    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable("id") Long id) {
        projectService.deleteById(id);
        return ResponseEntity.noContent().build(); // 204 sin contenido
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectDetails(@PathVariable("id") Long id) {

        Optional<Project> optionalProject = projectService.getById(id);
        if (optionalProject.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = optionalProject.get();
        
        // Forzar la carga de los entornos y sus servidores (si es LAZY)
        project.getEnvironments().forEach(env -> {
            env.getServer().getName(); // Acceder a algún campo fuerza la carga
        });

        return ResponseEntity.ok(project);
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(
            @PathVariable("id") Long id,
            @RequestBody Project updatedData) {

        Optional<Project> optionalProject = projectService.getById(id);
        if (optionalProject.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = optionalProject.get();
        project.setName(updatedData.getName());
        project.setDescription(updatedData.getDescription());
        project.setStatus(updatedData.getStatus());
        project.setTags(updatedData.getTags());
        project.setTechStack(updatedData.getTechStack());
        project.setInformacion(updatedData.getInformacion());

        projectService.save(project);
        return ResponseEntity.ok(Map.of("message", "Proyecto actualizado correctamente"));

    }

}
