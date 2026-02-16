package com.app.demo.controller;

import com.app.demo.dto.ActiveSessionLoginRequest;
import com.app.demo.dto.ActiveSessionResponse;
import com.app.demo.service.ActiveSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/active-sessions")
public class ActiveSessionController {

    private final ActiveSessionService activeSessionService;

    public ActiveSessionController(ActiveSessionService activeSessionService) {
        this.activeSessionService = activeSessionService;
    }

    @PostMapping("/login")
    public ResponseEntity<ActiveSessionResponse> login(@Valid @RequestBody ActiveSessionLoginRequest request) {
        ActiveSessionResponse response = ActiveSessionResponse.fromEntity(activeSessionService.login(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{sessionId}/validate")
    public ActiveSessionResponse validate(@PathVariable Long sessionId) {
        return ActiveSessionResponse.fromEntity(activeSessionService.validateSession(sessionId));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> logout(@PathVariable Long sessionId) {
        activeSessionService.logout(sessionId);
        return ResponseEntity.noContent().build();
    }
}
