package com.portal.ia.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentosService {

    private static final String FLASK_BASE_URL = "http://10.0.3.172:5000";

    private final RestTemplate restTemplate = new RestTemplate();

    {
        restTemplate.setErrorHandler(new ResponseErrorHandler() {
            @Override
            public boolean hasError(ClientHttpResponse response) throws IOException {
                return false; // No considerar ningún código como error
            }

            @Override
            public void handleError(ClientHttpResponse response) throws IOException {
                // No hacer nada
            }
        });
    }

    public ResponseEntity<String> subirDocumento(LinkedMultiValueMap<String, Object> files) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(files, headers);
        return restTemplate.postForEntity(FLASK_BASE_URL + "/subir_documentos", entity, String.class);
    }

    public ResponseEntity<String> crearIndice() {
        return restTemplate.postForEntity(FLASK_BASE_URL + "/crear_indice", null, String.class);
    }

    public ResponseEntity<String> estadoIndice() {
        return restTemplate.getForEntity(FLASK_BASE_URL + "/estado_indice", String.class);
    }

    public ResponseEntity<String> limpiarDocumentos() {
        return restTemplate.postForEntity(FLASK_BASE_URL + "/limpiar_documentos", null, String.class);
    }

    public ResponseEntity<String> preguntar(String question) {
        return postPregunta("/preguntar_documentos", question);
    }

    public ResponseEntity<String> preguntarSimple(String question) {
        return postPregunta("/preguntar_documentos_simple", question);
    }

    
    private ResponseEntity<String> postPregunta(String endpoint, String question) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, String> body = Map.of("question", question);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
            FLASK_BASE_URL + endpoint, entity, String.class
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
    public ResponseEntity<String> eliminarDocumento(String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("filename", filename);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        return restTemplate.postForEntity(
            FLASK_BASE_URL + "/eliminar_documento",
            entity,
            String.class
        );
    }
    public ResponseEntity<List<String>> listarDocumentos() {
        String url = FLASK_BASE_URL + "/listar_documentos";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<?, ?> parsed = mapper.readValue(response.getBody(), Map.class);
                Object docs = parsed.get("documentos");
                if (docs instanceof List) {
                    return ResponseEntity.ok((List<String>) docs);
                }
            } catch (Exception e) {
                return ResponseEntity.internalServerError().build();
            }
        }

        return ResponseEntity.status(response.getStatusCode()).body(List.of());
    }

}
