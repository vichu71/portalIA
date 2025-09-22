package com.portal.ia.controller;

import com.portal.ia.entity.Environment;
import com.portal.ia.entity.Project;
import com.portal.ia.service.EnvironmentService;
import com.portal.ia.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/environment")
@CrossOrigin
public class EnvironmentController {

	private final EnvironmentService environmentService;

    @Autowired
    public EnvironmentController(EnvironmentService environmentService) {
        this.environmentService = environmentService;
    }

    @GetMapping
    public ResponseEntity<Page<Environment>> getAllEnvironment(
            Pageable pageable,
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "orderBy", defaultValue = "type") String orderBy,
            @RequestParam(name = "isOrderDesc", defaultValue = "false") boolean isOrderDesc) {
        
        Page<Environment> result = environmentService.getEnvironmentByFilters(name, orderBy, isOrderDesc, pageable);
        return ResponseEntity.ok(result);
    }


    @GetMapping("/list")
    public ResponseEntity<List<Environment>> list() {
        return ResponseEntity.ok(environmentService.getAll());
    }

    @PostMapping
    public ResponseEntity<Environment> createEnvironment(@RequestBody Environment environment) {
        return ResponseEntity.ok(environmentService.save(environment));
    }


    @DeleteMapping("/{name}")
    public ResponseEntity<?> deleteByName(@PathVariable String name) {
        boolean deleted = environmentService.deleteByName(name);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}
