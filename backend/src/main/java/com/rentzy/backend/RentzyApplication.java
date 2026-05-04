package com.rentzy.backend;

import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class RentzyApplication {

	public static void main(String[] args) {
		SpringApplication.run(RentzyApplication.class, args);
	}

	@Bean
	CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
				jdbcTemplate.execute("UPDATE users SET role = 'TENANT' WHERE role = 'USER'");
				jdbcTemplate.execute("UPDATE users SET is_email_verified = true WHERE is_email_verified IS NULL OR is_email_verified = false");
			} catch (Exception e) {
				System.out.println("Could not drop constraint: " + e.getMessage());
			}
			
			if (userRepository.findByEmail("uddhavgaware80@gmail.com").isEmpty()) {
				User admin = new User();
				admin.setName("Uddhav Gaware");
				admin.setEmail("uddhavgaware80@gmail.com");
				admin.setPassword(passwordEncoder.encode("Udaygaware@123"));
				admin.setPhone("8767532364");
				admin.setRole(User.Role.ADMIN);
				admin.setIsVerified(true);
				userRepository.save(admin);
			} else {
                // If it already exists, ensure it is upgraded to ADMIN
                User existingUser = userRepository.findByEmail("uddhavgaware80@gmail.com").get();
                existingUser.setRole(User.Role.ADMIN);
                existingUser.setPhone("8767532364");
                userRepository.save(existingUser);
            }
		};
	}
}
