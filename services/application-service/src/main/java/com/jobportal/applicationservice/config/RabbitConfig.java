package com.jobportal.applicationservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public DirectExchange notificationExchange() {
        return new DirectExchange("notification.exchange");
    }

    @Bean
    public Queue applicationNotificationQueue() {
        return new Queue("application.notifications");
    }

    @Bean
    public Binding applicationBinding(Queue applicationNotificationQueue, DirectExchange notificationExchange) {
        return BindingBuilder.bind(applicationNotificationQueue).to(notificationExchange).with("application.status.changed");
    }
}
