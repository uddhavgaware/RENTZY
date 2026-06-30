package com.rentzy.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // ── Public: Auth endpoints ──
                .requestMatchers("/api/auth/**").permitAll()
                // ── Public: Static uploads ──
                .requestMatchers("/uploads/**").permitAll()
                // ── Public: WebSocket ──
                .requestMatchers("/ws/**").permitAll()
                // ── Public: Listing reads ──
                .requestMatchers(HttpMethod.GET, "/api/listings", "/api/listings/**").permitAll()
                // ── Public: Review reads ──
                .requestMatchers(HttpMethod.GET, "/api/reviews", "/api/reviews/**").permitAll()
                // ── Public: User Review reads ──
                .requestMatchers(HttpMethod.GET, "/api/user-reviews", "/api/user-reviews/**").permitAll()
                // ── Public: Roommate reads ──
                .requestMatchers(HttpMethod.GET, "/api/roommates", "/api/roommates/**").permitAll()
                // ── Public: User reads (owner profile, support button, user search) ──
                .requestMatchers(HttpMethod.GET, "/api/users/admin").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/{id}").permitAll()
                // ── Listing mutations: OWNER / ADMIN only ──
                .requestMatchers(HttpMethod.POST, "/api/listings/**").hasAnyRole("OWNER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/listings/**").hasAnyRole("OWNER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/listings/**").hasAnyRole("OWNER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/listings/**").hasAnyRole("OWNER", "ADMIN")
                // ── Admin-only ──
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/moving/admin/**").hasRole("ADMIN")
                // ── Mover-only ──
                .requestMatchers("/api/moving/vendor/**").hasRole("MOVER")
                // ── Everything else requires authentication ──
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String[] allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        java.util.List<String> origins = new java.util.ArrayList<>(Arrays.asList(allowedOrigins));
        if (!origins.contains("http://localhost")) origins.add("http://localhost");
        if (!origins.contains("capacitor://localhost")) origins.add("capacitor://localhost");
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
