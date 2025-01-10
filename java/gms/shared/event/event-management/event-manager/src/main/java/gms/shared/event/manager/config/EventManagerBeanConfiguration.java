package gms.shared.event.manager.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@ComponentScan({"gms.shared.spring", "gms.shared.system.events"})
@Configuration
public class EventManagerBeanConfiguration {}
