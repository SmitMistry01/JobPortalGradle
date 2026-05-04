package com.jobportal.aiservice.controller;

import com.jobportal.aiservice.dto.*;
import com.jobportal.aiservice.service.GeminiService;
import com.jobportal.aiservice.service.PdfService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final GeminiService geminiService;
    private final PdfService pdfService;

    public AiController(GeminiService geminiService, PdfService pdfService) {
        this.geminiService = geminiService;
        this.pdfService = pdfService;
    }

    @PostMapping("/extract-skills")
    public ResponseEntity<SkillExtractionResponse> extractSkills(@RequestBody SkillExtractionRequest request) {
        String pdfText = pdfService.extractTextFromPdfUrl(request.getResumeUrl());
        
        String prompt = "Extract a list of technical and soft skills from the following resume text. " +
                "Return ONLY a comma-separated list of skills, nothing else. " +
                "Do not include prefixes like 'Skills:' or markdown formatting. \n\nResume Text: " + pdfText;
        
        String responseText = geminiService.generateContent(prompt);
        
        List<String> skills = Arrays.stream(responseText.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
                
        SkillExtractionResponse response = new SkillExtractionResponse();
        response.setSkills(skills);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ats-score")
    public ResponseEntity<AtsScoreResponse> calculateAtsScore(@RequestBody AtsScoreRequest request) {
        String pdfText = pdfService.extractTextFromPdfUrl(request.getResumeUrl());
        
        String prompt = "Act as an expert ATS (Applicant Tracking System). Evaluate the following resume against the given job description. " +
                "Provide a score from 0 to 100 on how well the candidate matches the job requirements. " +
                "Also provide a brief 1-2 sentence feedback explaining the score. " +
                "Format your response EXACTLY as follows: \n" +
                "SCORE: [number]\n" +
                "FEEDBACK: [feedback text]\n\n" +
                "Job Description: " + request.getJobDescription() + "\n\n" +
                "Resume Text: " + pdfText;
                
        String responseText = geminiService.generateContent(prompt);
        
        int score = 0;
        String feedback = "Could not evaluate.";
        
        try {
            String[] parts = responseText.split("FEEDBACK:");
            if (parts.length == 2) {
                feedback = parts[1].trim();
                String scorePart = parts[0].replace("SCORE:", "").trim();
                score = Integer.parseInt(scorePart);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        AtsScoreResponse response = new AtsScoreResponse();
        response.setScore(score);
        response.setFeedback(feedback);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        String prompt = "You are a helpful customer service assistant for 'NexusCareers', a job portal platform. " +
                "Provide a helpful, concise, and professional answer to the user's message. \n\n" +
                "User: " + request.getMessage();
                
        String replyText = geminiService.generateContent(prompt);
        
        ChatResponse response = new ChatResponse();
        response.setReply(replyText);
        return ResponseEntity.ok(response);
    }
}
