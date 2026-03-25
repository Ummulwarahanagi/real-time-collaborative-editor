package com.collab.editor.controller;

import com.collab.editor.model.EditorDocument;
import com.collab.editor.repository.DocumentRepository;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RestController
public class EditorController {

    private final SimpMessagingTemplate messagingTemplate;
    private final DocumentRepository repo;

    private static final String DOC_ID = "MAIN_DOC";

    public EditorController(SimpMessagingTemplate messagingTemplate, DocumentRepository repo) {
        this.messagingTemplate = messagingTemplate;
        this.repo = repo;
    }

    // USERS
    private static Map<String, Map<String, String>> users = new ConcurrentHashMap<>();

    private int changeCounter = 0; 

    private String getRandomColor() {
        String[] colors = { "#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#FFC300" };
        return colors[new Random().nextInt(colors.length)];
    }

    // LOAD DOCUMENT
    @GetMapping("/document/{id}")
    public EditorDocument getDocument(@PathVariable String id) {
        return repo.findById(id).orElse(new EditorDocument(id, ""));
    }

    // JOIN
    @MessageMapping("/join")
    public void join(Map<String, String> message, @Header("simpSessionId") String sessionId) {

        Map<String, String> user = new HashMap<>();
        user.put("userId", message.get("userId"));
        user.put("color", getRandomColor());

        users.put(sessionId, user);

        EditorDocument doc = repo.findById(DOC_ID)
                .orElseGet(() -> repo.save(new EditorDocument(DOC_ID, "")));

        messagingTemplate.convertAndSendToUser(
                sessionId,
                "/queue/document",
                Map.of("content", doc.getContent()));

        broadcastUsers();
    }

    
    @MessageMapping("/edit")
    public void edit(Map<String, Object> message) {

        String content = (String) message.get("content");

        changeCounter++; 

        
        if (changeCounter % 5 == 0) {
            repo.save(new EditorDocument(DOC_ID, content));
        }

        messagingTemplate.convertAndSend(
                "/topic/document",
                Map.of("content", content));
    }

    // DISCONNECT
    @EventListener
    public void handleDisconnect(org.springframework.web.socket.messaging.SessionDisconnectEvent event) {

        users.remove(event.getSessionId());
        broadcastUsers();
    }

    private void broadcastUsers() {
        messagingTemplate.convertAndSend("/topic/users", users.values());
    }
}
