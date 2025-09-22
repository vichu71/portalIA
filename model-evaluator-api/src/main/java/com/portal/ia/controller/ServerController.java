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

import com.portal.ia.entity.Server;
import com.portal.ia.service.ServerService;

@RestController
@RequestMapping("/api/server")
@CrossOrigin
public class ServerController {

	private final ServerService serverService;

    @Autowired
    public ServerController(ServerService serverService) {
        this.serverService = serverService;
    }

    @GetMapping
    public ResponseEntity<Page<Server>> getAllServer(
            Pageable pageable,
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "orderBy", defaultValue = "name") String orderBy,
            @RequestParam(name = "isOrderDesc", defaultValue = "false") boolean isOrderDesc) {
        
        Page<Server> result = serverService.getServerByFilters(name, orderBy, isOrderDesc, pageable);
        return ResponseEntity.ok(result);
    }


    @GetMapping("/list")
    public ResponseEntity<List<Server>> list() {
        return ResponseEntity.ok(serverService.getAll());
    }

    @PostMapping
    public ResponseEntity<?> createServer(@RequestBody Server server) {
        if (server.getId() != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No se pueden editar proyectos aquí.");
        }
        return ResponseEntity.ok(serverService.save(server));
    }

   
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteServer(@PathVariable("id") Long id) {
    	serverService.deleteById(id);
        return ResponseEntity.noContent().build(); // 204 sin contenido
    }
    @GetMapping("/{id}")
    public ResponseEntity<Server> getById(@PathVariable("id") Long id) {
        return serverService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateServer(
            @PathVariable("id") Long id,
            @RequestBody Server updatedData) {

        Optional<Server> optionalServer = serverService.getById(id);
        if (optionalServer.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Server server = optionalServer.get();
        server.setName(updatedData.getName());
        server.setIp(updatedData.getIp());
        server.setOs(updatedData.getOs());
        server.setNotes(updatedData.getNotes());

        serverService.save(server);
        return ResponseEntity.ok(Map.of("message", "Servidor actualizado correctamente"));
    }

}
