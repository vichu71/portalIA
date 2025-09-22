package com.portal.ia.service;
	
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;

import com.portal.ia.entity.Project;
import com.portal.ia.repository.ProjectRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ReadmeSyncService {

    private static final Logger logger = LoggerFactory.getLogger(ReadmeSyncService.class);

    private final DocumentosService documentosService;
    private final ProjectRepository projectRepository;

    public ReadmeSyncService(DocumentosService documentosService,ProjectRepository projectRepository) {
        this.documentosService = documentosService;
		this.projectRepository = projectRepository;
    }

    public void sync(Project project) {
        try {
            String markdown = project.getInformacion();
            if (markdown == null || markdown.isBlank()) {
                logger.info("ℹ️ Proyecto {} no tiene README para sincronizar.", project.getId());
                return;
            }

            byte[] readmeBytes = markdown.getBytes(StandardCharsets.UTF_8);

            ByteArrayResource resource = new ByteArrayResource(readmeBytes) {
                @Override
                public String getFilename() {
                	String slug = project.getName()
                		    .toLowerCase()
                		    .replaceAll("[^a-z0-9]+", "-") // reemplaza todo lo no alfanumérico por "-"
                		    .replaceAll("(^-|-$)", "");    // quita guiones al inicio y fin

                		String nombreFichero = "readme-" + project.getId() + "-" + slug + ".md";

                    return "readme-project-" +slug + ".md";
                }
            };

            LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("files", resource);

            logger.info("⬆️ Subiendo README del proyecto {} a la IA...", project.getId());
            ResponseEntity<String> uploadResponse = documentosService.subirDocumento(body);

            if (uploadResponse.getStatusCode().is2xxSuccessful()) {
                logger.info("✅ README del proyecto {} subido correctamente.", project.getId());

                logger.info("🧠 Solicitando creación de índice FAISS...");
                ResponseEntity<String> indexResponse = documentosService.crearIndice();

                if (indexResponse.getStatusCode().is2xxSuccessful()) {
                    logger.info("✅ Índice FAISS actualizado correctamente.");
                } else {
                    logger.warn("⚠️ Fallo al crear índice FAISS: {}", indexResponse.getStatusCode());
                }
            } else {
                logger.warn("❌ Fallo al subir README del proyecto {}: {}", project.getId(), uploadResponse.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("❌ Error sincronizando README del proyecto {} con IA: {}", project.getId(), e.getMessage());
        }
    }

    public void eliminarReadme(Project project) {
        try {
            String slug = project.getName()
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");

            String filename = "readme-project-" + slug + ".md";

            logger.info("🗑️ Solicitando eliminación de {} en la IA...", filename);
            ResponseEntity<String> response = documentosService.eliminarDocumento(filename);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("✅ Archivo {} eliminado correctamente.", filename);

                logger.info("🧠 Reindexando FAISS tras eliminación...");
                documentosService.crearIndice();
            } else {
                logger.warn("⚠️ Fallo al eliminar {}: {}", filename, response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("❌ Error eliminando README del proyecto {}: {}", project.getId(), e.getMessage());
        }
    }

} 

