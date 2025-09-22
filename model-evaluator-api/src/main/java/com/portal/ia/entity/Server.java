package com.portal.ia.entity;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Server {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String ip;
    private String os;
    
    @Lob
    private String notes;
}

