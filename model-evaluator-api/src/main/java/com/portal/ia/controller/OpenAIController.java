package com.portal.ia.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.ia.dto.OpenAIResponse;
import com.portal.ia.dto.PromptRequest;
import com.portal.ia.service.OpenAIService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/openai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001") // permite llamadas desde React
public class OpenAIController {

    private final OpenAIService openAIService;

    @PostMapping
    public OpenAIResponse getCompletion(@RequestBody PromptRequest request) {
        String result = openAIService.callOpenAI(request.getPrompt());
        return new OpenAIResponse(result);
    }
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

}
