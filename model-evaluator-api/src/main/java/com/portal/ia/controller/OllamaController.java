package com.portal.ia.controller;

import com.portal.ia.dto.PromptRequest;
import com.portal.ia.dto.OpenAIResponse;
import com.portal.ia.service.OllamaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ollama")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class OllamaController {

    private final OllamaService mistralService;

    @PostMapping("/mistral")
    public OpenAIResponse chat(@RequestBody PromptRequest request) {
        String response = mistralService.callMistral(request.getPrompt());
        return new OpenAIResponse(response);
    }
    @PostMapping("/deepseek")
    public OpenAIResponse responder(@RequestBody PromptRequest request) {
    	 String response = mistralService.callDeepSeek(request.getPrompt());
         return new OpenAIResponse(response);
    }
}
