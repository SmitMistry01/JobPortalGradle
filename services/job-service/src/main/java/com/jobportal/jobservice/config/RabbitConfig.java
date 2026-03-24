package com.jobportal.jobservice.config;

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
    public Queue jobNotificationQueue() {
        return new Queue("job.notifications");
    }

    @Bean
    public Binding jobBinding(Queue jobNotificationQueue, DirectExchange notificationExchange) {
        return BindingBuilder.bind(jobNotificationQueue).to(notificationExchange).with("job.posted");
    }
}
