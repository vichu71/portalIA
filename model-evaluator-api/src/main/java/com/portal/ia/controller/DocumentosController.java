package com.portal.ia.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.portal.ia.dto.DocumentosRequest;
import com.portal.ia.service.DocumentosService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
@Slf4j
public class DocumentosController {

    private final DocumentosService documentService;

    @PostMapping(value = "/subir", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> subir(@RequestPart("files") List<MultipartFile> files) throws IOException {
        log.info("📁 Recibida solicitud para subir {} archivo(s)", files.size());

        var body = new org.springframework.util.LinkedMultiValueMap<String, Object>();
        for (MultipartFile file : files) {
            log.info("→ Archivo recibido: {}", file.getOriginalFilename());
            body.add("files", new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
        }

        return documentService.subirDocumento(body);
    }

    @PostMapping("/crear-indice")
    public ResponseEntity<String> crearIndice() {
        log.info("🧠 Solicitud para crear índice FAISS");
        return documentService.crearIndice();
    }

    @GetMapping("/estado-indice")
    public ResponseEntity<String> estadoIndice() {
        log.info("🔍 Consulta del estado actual del índice");
        return documentService.estadoIndice();
    }

    @PostMapping("/preguntar")
    public ResponseEntity<String> preguntar(@RequestBody DocumentosRequest request) {
        log.info("📚 Pregunta sobre documentos (con contexto): {}", request.getQuestion());
        return documentService.preguntar(request.getQuestion());
    }

    @PostMapping("/preguntar-simple")
    public ResponseEntity<String> preguntarSimple(@RequestBody DocumentosRequest request) {
        log.info("📚 Pregunta sobre documentos (solo respuesta): {}", request.getQuestion());
        return documentService.preguntarSimple(request.getQuestion());
    }

    @PostMapping("/limpiar")
    public ResponseEntity<String> limpiar() {
        log.info("🧹 Solicitud para limpiar documentos y eliminar índice");
        return documentService.limpiarDocumentos();
    }
    @GetMapping("/listar")
    public ResponseEntity<List<String>> listarDocumentos() {
    	 log.info(" Solicitud para listar documentos");
        return documentService.listarDocumentos();
    }
    @DeleteMapping("/eliminar")
    public ResponseEntity<?> eliminarDocumento(@RequestBody Map<String, String> body) {
        String filename = body.get("filename");
        if (filename == null) {
            return ResponseEntity.badRequest().body("Falta el nombre del fichero");
        }
        documentService.eliminarDocumento(filename);
        return ResponseEntity.ok().build();
    }

}
