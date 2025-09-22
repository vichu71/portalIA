package com.portal.ia.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class HugginFaceService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    // Puedes inyectar un bean asyncExecutor si lo tienes configurado
    private final Executor asyncExecutor = Executors.newFixedThreadPool(4);

    public CompletableFuture<String> responderConsultaGeneral(String pregunta) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("🤖 Llamando a Mistral Flask con pregunta general: {}", pregunta);

                Map<String, String> body = Map.of("question", pregunta);
                String jsonBody = objectMapper.writeValueAsString(body);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(new URI("http://10.0.3.172:5000/responder_general"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    Map<String, Object> result = objectMapper.readValue(response.body(), Map.class);
                    return (String) result.getOrDefault("respuesta", "Sin respuesta generada.");
                } else {
                    log.error("❌ Error del servicio Mistral Flask: {}", response.body());
                    return "Error al generar respuesta general.";
                }

            } catch (Exception e) {
                log.error("❌ Error en responderConsultaGeneral: {}", e.getMessage());
                return "Error al comunicarse con el servicio general.";
            }
        }, asyncExecutor);
    }
}
