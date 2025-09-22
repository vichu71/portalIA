-- Tabla de proyectos
CREATE TABLE project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50), -- Ej: 'dev', 'prod', 'archived'
    tags VARCHAR(255),
    tech_stack TEXT
);

-- Tabla de servidores
CREATE TABLE server (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip VARCHAR(100),
    os VARCHAR(100),
    notes TEXT
);

-- Tabla de entornos
CREATE TABLE environment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50), -- Ej: 'dev', 'test', 'prod'
    deploy_instructions TEXT,
    commands TEXT,
    
    project_id BIGINT,
    server_id BIGINT,
    
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (server_id) REFERENCES server(id) ON DELETE SET NULL
);
