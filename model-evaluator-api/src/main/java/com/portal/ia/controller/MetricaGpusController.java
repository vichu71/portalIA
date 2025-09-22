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
import com.portal.ia.service.MetricaGpusService;
import com.portal.ia.service.ServerService;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/metrics")
@CrossOrigin
@Slf4j
//@AllArgsConstructor
public class MetricaGpusController {

	 private final MetricaGpusService metricaGpusService;

	 @Autowired
	    public MetricaGpusController(MetricaGpusService metricaGpusService) {
	        this.metricaGpusService = metricaGpusService;
	    }


    @GetMapping("/gpu")
    public ResponseEntity<List<Map<String, Object>>> getGpuMetrics() {
        List<Map<String, Object>> gpuMetrics = metricaGpusService.getGpuMetrics();
        log.info("Métricas de GPU enviadas: {}", gpuMetrics);
        return ResponseEntity.ok(gpuMetrics);
    }
}
