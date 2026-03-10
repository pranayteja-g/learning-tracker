export const TEMPLATES = {
  java: {
    id: "java", label: "Java", color: "#e76f51", accent: "#f4a261",
    sections: {
      "Core Basics": ["Basic Syntax", "Data Types", "Conditionals", "Arrays", "Loops", "Variables and Scopes", "Type Casting", "Strings and Methods", "Math Operations"],
      "Classes & OOP": ["Classes and Objects", "Attributes and Methods", "Access Specifiers", "Static Keyword", "Nested Classes", "Basics of OOP", "Method Chaining", "Enums", "Final Keyword", "Object Lifecycle"],
      "Advanced OOP": ["Inheritance", "Abstraction", "Method Overloading / Overriding", "Static vs Dynamic Binding", "Encapsulation", "Interfaces", "Record", "Packages", "Initializer Block", "Pass by Value / Pass by Reference", "Annotations", "Lambda Expressions", "Modules"],
      "Collections": ["Array vs ArrayList", "Set", "Map", "Queue", "Stack", "Dequeue", "Iterator", "Generic Collections", "Optionals"],
      "Concurrency & Functional": ["Threads", "Virtual Threads", "Java Memory Model", "volatile keyword", "Functional Composition", "High Order Functions", "Functional Interfaces", "Stream API"],
      "I/O & Networking": ["File Operations", "Cryptography", "Date and Time", "Regular Expressions", "Networking"],
      "Frameworks & DB": ["Spring Boot", "Play Framework", "Quarkus", "Maven", "Gradle", "Spring Data JPA", "Hibernate", "EBean", "JDBC"],
      "Testing & Logging": ["JUnit", "TestNG", "REST Assured", "JMeter", "Cucumber-JVM", "Mockito", "Logback", "Log4j2", "SLF4J", "TinyLog"],
    },
  },
  springboot: {
    id: "springboot", label: "Spring Boot", color: "#2d6a4f", accent: "#52b788",
    sections: {
      "Core Spring": ["Spring IOC", "Dependency Injection", "Spring AOP", "Spring Bean Scope", "Annotations", "Architecture", "Why use Spring?"],
      "Spring MVC": ["Spring MVC Architecture", "Servlet", "JSP Files", "Spring MVC Components"],
      "Spring Boot Essentials": ["Spring Boot Starters", "Autoconfiguration", "Actuators", "Embedded Server"],
      "Spring Security": ["Authentication", "Authorization", "OAuth2", "JWT Authentication"],
      "Spring Data": ["Spring Data JPA", "Spring Data MongoDB", "Spring Data JDBC", "Hibernate", "Transactions", "Relationships", "Entity Lifecycle"],
      "Microservices": ["Spring Cloud Gateway", "Cloud Config", "Spring Cloud Circuit Breaker", "Spring Cloud Open Feign", "Micrometer", "Eureka"],
      "Testing": ["JPA Test", "Mock MVC", "@SpringBootTest Annotation", "@MockBean Annotation"],
    },
  },
  systemdesign: {
    id: "systemdesign", label: "System Design", color: "#4361ee", accent: "#7b8cde",
    sections: {
      "Fundamentals": ["What is System Design?", "How to approach System Design?", "Performance vs Scalability", "Latency vs Throughput", "Availability vs Consistency", "CAP Theorem"],
      "Consistency & Availability": ["Weak Consistency", "Eventual Consistency", "Strong Consistency", "Fail-Over Active-Active", "Fail-Over Active-Passive", "Master-Slave Replication", "Master-Master Replication", "99.9% Availability", "99.99% Availability"],
      "Infrastructure": ["Domain Name System", "Push CDNs", "Pull CDNs", "Load Balancers", "LB vs Reverse Proxy", "Load Balancing Algorithms", "Layer 7 Load Balancing", "Layer 4 Load Balancing", "Horizontal Scaling"],
      "Databases": ["SQL vs NoSQL", "DB Replication", "Sharding", "Federation", "Denormalization", "SQL Tuning", "RDBMS", "Key-Value Store", "Document Store", "Wide Column Store", "Graph Databases"],
      "Caching": ["Cache Aside", "Write-through", "Write-behind", "Refresh Ahead", "Client Caching", "CDN Caching", "Web Server Caching", "Database Caching", "Application Caching"],
      "Async & Communication": ["Task Queues", "Message Queues", "Back Pressure", "HTTP", "TCP", "UDP", "REST", "RPC", "gRPC", "GraphQL", "Idempotent Operations"],
      "Cloud & Reliability Patterns": ["Circuit Breaker", "Bulkhead", "Retry", "Health Endpoint Monitoring", "Queue-Based Load Leveling", "CQRS", "Event Sourcing", "Strangler Fig", "Sidecar", "Ambassador"],
      "Monitoring": ["Health Monitoring", "Availability Monitoring", "Performance Monitoring", "Security Monitoring", "Usage Monitoring", "Instrumentation", "Visualization & Alerts"],
    },
  },
};

export const COLOR_PALETTE = [
  { color: "#e76f51", accent: "#f4a261" },
  { color: "#2d6a4f", accent: "#52b788" },
  { color: "#4361ee", accent: "#7b8cde" },
  { color: "#9b2226", accent: "#e9d8a6" },
  { color: "#7b2d8b", accent: "#c77dff" },
  { color: "#0077b6", accent: "#48cae4" },
  { color: "#b5838d", accent: "#e5989b" },
  { color: "#606c38", accent: "#a7c957" },
  { color: "#ca6702", accent: "#ee9b00" },
  { color: "#415a77", accent: "#778da9" },
];
