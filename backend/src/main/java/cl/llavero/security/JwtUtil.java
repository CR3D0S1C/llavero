package cl.llavero.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generarToken(String usuarioId, String nombre, String rol, String turnoId, String sessionId) {
        return Jwts.builder()
                .subject(usuarioId)
                .claim("nombre", nombre)
                .claim("rol", rol)
                .claim("turnoId", turnoId)
                .claim("sid", sessionId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parsearToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean esValido(String token) {
        try {
            parsearToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUsuarioId(String token) {
        return parsearToken(token).getSubject();
    }

    public String getRol(String token) {
        return parsearToken(token).get("rol", String.class);
    }

    public String getTurnoId(String token) {
        return parsearToken(token).get("turnoId", String.class);
    }

    public String getSessionId(String token) {
        return parsearToken(token).get("sid", String.class);
    }
}
