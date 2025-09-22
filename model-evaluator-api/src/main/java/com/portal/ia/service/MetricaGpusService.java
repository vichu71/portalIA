package com.portal.ia.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Slf4j

//@AllArgsConstructor
@Service
public class MetricaGpusService {

	/**
     * 🔹 Obtiene las métricas de la GPU
     */
	
   
    private static final String SYSTEM_METRICS_URL = "http://10.0.3.172:5001/system_metrics";
    private static final String GPU_METRICS_URL = "http://10.0.3.172:5001/gpu_metrics";

    private static final RestTemplate restTemplate = new RestTemplate();

    // 🔹 Cache de métricas para evitar hacer llamadas innecesarias
    private Map<String, Object> cachedSystemMetrics = new HashMap<>();
    private List<Map<String, Object>> cachedGpuMetrics = new ArrayList<>();
    private long lastSystemMetricsFetch = 0;
    private long lastGpuMetricsFetch = 0;
    private static final long CACHE_EXPIRATION_MS = 2000; // 2 segundos
   
    
    
    public List<Map<String, Object>> getGpuMetrics() {
        long now = System.currentTimeMillis();
        if (now - lastGpuMetricsFetch < CACHE_EXPIRATION_MS) {
            return cachedGpuMetrics;
        }

        try {
            log.trace("[AIMetrics] Solicitando métricas de GPU a {}", GPU_METRICS_URL);
            List<Map<String, Object>> response = restTemplate.getForObject(GPU_METRICS_URL, List.class);

            if (response != null) {
                cachedGpuMetrics = response;
                lastGpuMetricsFetch = now;
                return cachedGpuMetrics;
            }
        } catch (Exception e) {
           // incrementErrorCounter("ai.gpu.metrics.errors");
            log.error("[AIMetrics] Error al obtener métricas de GPU: {}", e.getMessage());
        }

        // En caso de error, devolver valores predeterminados
        return List.of(Map.of(
            "gpu_index", -1,
            "gpu_name", "Unknown",
            "gpu_utilization", -1,
            "memory_total_mb", -1,
            "memory_used_mb", -1
        ));
    }
	
}
