-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.11.0-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para portalia
CREATE DATABASE IF NOT EXISTS `portalia` /*!40100 DEFAULT CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci */;
USE `portalia`;

-- Volcando estructura para tabla portalia.environment
CREATE TABLE IF NOT EXISTS `environment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `deploy_instructions` longtext COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `commands` longtext COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `server_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `server_id` (`server_id`),
  CONSTRAINT `environment_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `environment_ibfk_2` FOREIGN KEY (`server_id`) REFERENCES `server` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla portalia.project
CREATE TABLE IF NOT EXISTS `project` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb3_spanish_ci NOT NULL,
  `description` text COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `tags` varchar(255) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `tech_stack` text COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla portalia.server
CREATE TABLE IF NOT EXISTS `server` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb3_spanish_ci NOT NULL,
  `ip` varchar(100) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `os` varchar(100) COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `notes` longtext COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;

-- La exportación de datos fue deseleccionada.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
