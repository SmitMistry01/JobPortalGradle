package com.jobportal.apigateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

//Without rate limiting:one user can send 1000 requests/sec, can crash services, DDoS
@Configuration
public class GatewayRateLimitConfig {
//KeyResolver generates key, RateLimiter checks limit for that key
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> Mono.just(resolveKey(exchange));
    }

    private String resolveKey(ServerWebExchange exchange) {
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if (userId != null && !userId.isBlank()) {
            return "user:" + userId; //Rate limit is applied per logged-in user
        }

        String ip = exchange.getRequest().getRemoteAddress() == null
                ? "unknown"
                : exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        return "ip:" + ip; //Rate limit is applied per IP address
    }
}
//redis config
//replenishRate: tokens added per second
//burstCapacity: max requests allowed instantly