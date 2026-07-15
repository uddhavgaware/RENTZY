package com.rentzy.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    // LRU cache with max 10,000 entries to prevent unbounded memory growth
    private static final int MAX_CACHE_SIZE = 10_000;
    private final Map<String, Bucket> cache = Collections.synchronizedMap(
            new LinkedHashMap<>(256, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Bucket> eldest) {
                    return size() > MAX_CACHE_SIZE;
                }
            }
    );

    // Strict limits for Auth
    private final Bandwidth authLimit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
    
    // Global limits for other APIs
    private final Bandwidth globalLimit = Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1)));

    private Bucket resolveBucket(String ip, String path) {
        return cache.computeIfAbsent(ip + "-" + (path.startsWith("/api/auth") ? "auth" : "global"), key -> {
            if (path.startsWith("/api/auth")) {
                return Bucket.builder().addLimit(authLimit).build();
            } else {
                return Bucket.builder().addLimit(globalLimit).build();
            }
        });
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String ip = getClientIP(request);
        String path = request.getRequestURI();
        
        Bucket bucket = resolveBucket(ip, path);
        
        if (bucket.tryConsume(1)) {
            return true;
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            return false;
        }
    }
}
