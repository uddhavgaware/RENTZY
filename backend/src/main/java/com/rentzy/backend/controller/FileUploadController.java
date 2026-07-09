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

import java.util.concurrent.CompletableFuture;
import java.util.Arrays;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<List<String>> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        List<CompletableFuture<String>> uploadFutures = Arrays.stream(files)
                .filter(file -> !file.isEmpty())
                .map(file -> CompletableFuture.supplyAsync(() -> {
                    try {
                        return cloudinaryService.uploadFile(file);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to upload file to Cloudinary", e);
                    }
                }))
                .collect(Collectors.toList());

        try {
            CompletableFuture.allOf(uploadFutures.toArray(new CompletableFuture[0])).join();
            List<String> fileDownloadUris = uploadFutures.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(fileDownloadUris);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
