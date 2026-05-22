package com.rentzy.backend.controller;

import com.rentzy.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<List<String>> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        List<String> fileDownloadUris = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            
            try {
                String fileDownloadUri = cloudinaryService.uploadFile(file);
                fileDownloadUris.add(fileDownloadUri);
            } catch (Exception ex) {
                try {
                    String base64 = "data:" + file.getContentType() + ";base64," + java.util.Base64.getEncoder().encodeToString(file.getBytes());
                    fileDownloadUris.add(base64);
                } catch (IOException e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                }
            }
        }

        return ResponseEntity.ok(fileDownloadUris);
    }
}
