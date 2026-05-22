package com.rentzy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.bouncycastle.jcajce.provider.asymmetric.ec.BCECPublicKey;
import org.bouncycastle.jcajce.provider.asymmetric.ec.BCECPrivateKey;

@Service
public class VapidService {

    @Value("${vapid.public.key:}")
    private String configPublicKey;

    @Value("${vapid.private.key:}")
    private String configPrivateKey;

    @Getter
    private String publicKeyBase64;

    @Getter
    private String privateKeyBase64;

    @PostConstruct
    public void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        loadOrGenerateKeys();
    }

    private void loadOrGenerateKeys() {
        if (configPublicKey != null && !configPublicKey.trim().isEmpty() && configPrivateKey != null && !configPrivateKey.trim().isEmpty()) {
            this.publicKeyBase64 = configPublicKey.trim();
            this.privateKeyBase64 = configPrivateKey.trim();
            System.out.println("✅ VAPID keys loaded successfully from Environment Variables / application.properties");
            return;
        }

        File dataDir = new File("data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }

        File keyFile = new File(dataDir, "vapid.json");
        ObjectMapper mapper = new ObjectMapper();

        if (keyFile.exists()) {
            try {
                Map<String, String> keys = mapper.readValue(keyFile, Map.class);
                this.publicKeyBase64 = keys.get("publicKey");
                this.privateKeyBase64 = keys.get("privateKey");
                System.out.println("VAPID keys loaded successfully from " + keyFile.getAbsolutePath());
                return;
            } catch (Exception e) {
                System.err.println("Failed to load VAPID keys, regenerating... " + e.getMessage());
            }
        }

        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC", new BouncyCastleProvider());
            kpg.initialize(new ECGenParameterSpec("secp256r1"));
            KeyPair kp = kpg.generateKeyPair();
            
            BCECPublicKey pub = (BCECPublicKey) kp.getPublic();
            BCECPrivateKey priv = (BCECPrivateKey) kp.getPrivate();

            byte[] pubBytes = pub.getQ().getEncoded(false);
            byte[] privBytes = priv.getD().toByteArray();
            
            if (privBytes.length == 33 && privBytes[0] == 0) {
                privBytes = java.util.Arrays.copyOfRange(privBytes, 1, 33);
            } else if (privBytes.length < 32) {
                byte[] padded = new byte[32];
                System.arraycopy(privBytes, 0, padded, 32 - privBytes.length, privBytes.length);
                privBytes = padded;
            }

            this.publicKeyBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(pubBytes);
            this.privateKeyBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(privBytes);

            Map<String, String> keys = new HashMap<>();
            keys.put("publicKey", this.publicKeyBase64);
            keys.put("privateKey", this.privateKeyBase64);

            mapper.writeValue(keyFile, keys);
            System.out.println("===============================================================");
            System.out.println("⚠️ VAPID KEYS GENERATED! YOU MUST ADD THESE TO RENDER ENV VARS:");
            System.out.println("VAPID_PUBLIC_KEY=" + this.publicKeyBase64);
            System.out.println("VAPID_PRIVATE_KEY=" + this.privateKeyBase64);
            System.out.println("===============================================================");
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate VAPID keys", e);
        }
    }
}
