package com.smartfare.conductor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.smartfare.conductor")
public class ConductorApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConductorApplication.class, args);
        System.out.println("🚌 Smart Fare Conductor Backend Started!");
        System.out.println("📍 Server running on http://localhost:8082");
    }
}
