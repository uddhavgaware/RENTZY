package com.rentzy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import nl.martijndwars.webpush.Utils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.security.*;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class VapidService {

    @Getter
    private PublicKey publicKey;

    @Getter
    private PrivateKey privateKey;

    @Getter
    private String publicKeyBase64;

    @PostConstruct
    public void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        loadOrGenerateKeys();
    }

    private void loadOrGenerateKeys() {
        File dataDir = new File("data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }

        File keyFile = new File(dataDir, "vapid.json");
        ObjectMapper mapper = new ObjectMapper();

        if (keyFile.exists()) {
            try {
                Map<String, String> keys = mapper.readValue(keyFile, Map.class);
                String pub = keys.get("publicKey");
                String priv = keys.get("privateKey");

                this.publicKey = Utils.loadPublicKey(pub);
                this.privateKey = Utils.loadPrivateKey(priv);
                this.publicKeyBase64 = pub;
                System.out.println("VAPID keys loaded successfully from " + keyFile.getAbsolutePath());
                return;
            } catch (Exception e) {
                System.err.println("Failed to load VAPID keys, regenerating... " + e.getMessage());
            }
        }

        try {
            KeyPair keyPair = Utils.generateKeyPair();
            this.publicKey = keyPair.getPublic();
            this.privateKey = keyPair.getPrivate();

            // Save public key as uncompressed EC public key (65 bytes)
            byte[] encodedPubKey = Utils.savePublicKey(publicKey);
            // Save private key as PKCS#8 bytes
            byte[] encodedPrivKey = Utils.savePrivateKey(privateKey);
            
            this.publicKeyBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(encodedPubKey);
            String privateKeyBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(encodedPrivKey);

            Map<String, String> keys = new HashMap<>();
            keys.put("publicKey", this.publicKeyBase64);
            keys.put("privateKey", privateKeyBase64);

            mapper.writeValue(keyFile, keys);
            System.out.println("VAPID keys generated and saved to " + keyFile.getAbsolutePath());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate VAPID keys", e);
        }
    }
}
