package com.glowkart.customer.geo;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ReverseGeoServiceImpl implements ReverseGeoService {

    private static final String NOMINATIM_URL =
            "https://nominatim.openstreetmap.org/reverse" +
            "?lat=%s&lon=%s&format=json&addressdetails=1";

    // 🔐 REQUIRED by Nominatim usage policy
    private static final String USER_AGENT =
            "GlowKart-Backend/1.0 (contact: tech@glowkart.com)";

    // 🧠 Cache: rounded lat/lon -> state
    private final Map<String, String> stateCache = new ConcurrentHashMap<>();

    // ⏱ Rate limit (1 req / sec)
    private volatile Instant lastRequestTime = Instant.EPOCH;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String resolveState(double latitude, double longitude) {

        // 🔑 Round to reduce cache cardinality (~110m accuracy)
        String cacheKey = String.format("%.3f,%.3f", latitude, longitude);

        return stateCache.computeIfAbsent(cacheKey, key -> {
            try {
                rateLimit();
                return fetchStateFromNominatim(latitude, longitude);
            } catch (Exception e) {
                return null; // fail safe
            }
        });
    }

    // =========================================================
    // Internal helpers
    // =========================================================

    private String fetchStateFromNominatim(double latitude, double longitude) {

        String url = String.format(
                NOMINATIM_URL,
                latitude,
                longitude
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", USER_AGENT);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

        Map<?, ?> body = response.getBody();
        if (body == null) return null;

        Object addressObj = body.get("address");
        if (!(addressObj instanceof Map<?, ?> addressMap)) {
            return null;
        }

        Object stateObj = addressMap.get("state");
        return stateObj != null ? stateObj.toString() : null;
    }

    /**
     * Ensures we never exceed 1 request / second
     */
    private synchronized void rateLimit() {

        Instant now = Instant.now();
        long elapsedMs = now.toEpochMilli() - lastRequestTime.toEpochMilli();

        if (elapsedMs < 1100) {
            try {
                Thread.sleep(1100 - elapsedMs);
            } catch (InterruptedException ignored) {
            }
        }

        lastRequestTime = Instant.now();
    }
}
