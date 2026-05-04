package com.jobportal.aiservice.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URL;

@Service
public class PdfService {

    public String extractTextFromPdfUrl(String pdfUrl) {
        try (InputStream in = new URL(pdfUrl).openStream();
             PDDocument document = Loader.loadPDF(in.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (Exception e) {
            e.printStackTrace();
            return ""; // Fallback or handle appropriately
        }
    }
}
