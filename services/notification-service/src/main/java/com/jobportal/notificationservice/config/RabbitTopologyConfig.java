package com.jobportal.notificationservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

//Define of binding(link btw exchange and queue)
//Producer → Exchange → Queue → Consumer
@Configuration
public class RabbitTopologyConfig {

    private static final String NOTIFICATION_EXCHANGE = "notification.exchange";
    private static final String JOB_NOTIFICATIONS_QUEUE = "job.notifications";
    private static final String APPLICATION_NOTIFICATIONS_QUEUE = "application.notifications";
    private static final String JOB_POSTED_ROUTING_KEY = "job.posted";
    private static final String APPLICATION_STATUS_CHANGED_ROUTING_KEY = "application.status.changed";

    @Bean
    public DirectExchange notificationExchange() {
        return new DirectExchange(NOTIFICATION_EXCHANGE);
    }

    @Bean
    public Queue jobNotificationsQueue() {
        return new Queue(JOB_NOTIFICATIONS_QUEUE);
    }

    @Bean
    public Queue applicationNotificationsQueue() {
        return new Queue(APPLICATION_NOTIFICATIONS_QUEUE);
    }

    @Bean
    public Binding jobNotificationsBinding(Queue jobNotificationsQueue, DirectExchange notificationExchange) {
        return BindingBuilder.bind(jobNotificationsQueue)
                .to(notificationExchange)
                .with(JOB_POSTED_ROUTING_KEY);
    }

    @Bean
    public Binding applicationNotificationsBinding(
            Queue applicationNotificationsQueue,
            DirectExchange notificationExchange
    ) {
        return BindingBuilder.bind(applicationNotificationsQueue)
                .to(notificationExchange)
                .with(APPLICATION_STATUS_CHANGED_ROUTING_KEY);
    }
}

