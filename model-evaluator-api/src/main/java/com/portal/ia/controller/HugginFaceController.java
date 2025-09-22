package com.portal.ia.controller;

import com.portal.ia.dto.PromptRequest;
import com.portal.ia.dto.OpenAIResponse;
import com.portal.ia.service.HugginFaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/hugginface")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class HugginFaceController {

    private final HugginFaceService generalResponseService;

    @PostMapping("/mistral")
    public CompletableFuture<OpenAIResponse> responder(@RequestBody PromptRequest request) {
        return generalResponseService.responderConsultaGeneral(request.getPrompt())
                .thenApply(OpenAIResponse::new);
    }
}
