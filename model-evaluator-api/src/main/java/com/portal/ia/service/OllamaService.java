package com.portal.ia.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class OllamaService {

	private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    private static final String OLLAMA_MISTRAL_URL = "http://10.0.3.172:5000/responder_ollama_mistral";
    private static final String OLLAMA_DEEPSEEK_URL = "http://10.0.3.172:5000/responder_ollama_deepseek";

    public String callMistral(String question) {
        try {
            if (question == null || question.trim().isEmpty()) {
                throw new IllegalArgumentException("La pregunta está vacía.");
            }

            log.info("🧠 Enviando pregunta a Mistral vía Flask: {}", question);

            Map<String, String> body = Map.of("question", question);
            String requestBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(OLLAMA_MISTRAL_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> result = objectMapper.readValue(response.body(), Map.class);
                String respuesta = (String) result.getOrDefault("respuesta", "Sin respuesta generada.");
                log.info("✅ Respuesta Mistral (Ollama): {}", respuesta);
                return respuesta;
            } else {
                log.error("❌ Error desde Flask/Ollama: {}", response.body());
                return "Error al generar respuesta desde Mistral (Ollama).";
            }

        } catch (Exception e) {
            log.error("❌ Excepción al contactar con Mistral/Ollama: {}", e.getMessage(), e);
            return "Error al comunicarse con el servicio Mistral.";
        }
    }

	public String callDeepSeek(String question) {
		try {
            if (question == null || question.trim().isEmpty()) {
                throw new IllegalArgumentException("La pregunta está vacía.");
            }

            log.info("🧠 Enviando pregunta a DeepSeek vía Flask: {}", question);

            Map<String, String> body = Map.of("question", question);
            String requestBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(OLLAMA_DEEPSEEK_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> result = objectMapper.readValue(response.body(), Map.class);
                String respuesta = (String) result.getOrDefault("respuesta", "Sin respuesta generada.");
                log.info("✅ Respuesta DeepSeek (Ollama): {}", respuesta);
                return respuesta;
            } else {
                log.error("❌ Error desde Flask/Ollama: {}", response.body());
                return "Error al generar respuesta desde DeepSeek (Ollama).";
            }

        } catch (Exception e) {
            log.error("❌ Excepción al contactar con DeepSeek/Ollama: {}", e.getMessage(), e);
            return "Error al comunicarse con el servicio DeepSeek.";
        }
	}
}
