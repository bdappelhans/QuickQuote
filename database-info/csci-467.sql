CREATE TABLE `sales_assoc` (
  `id` varchar(20) NOT NULL,
  `first_name` varchar(20) NOT NULL,
  `last_name` varchar(25) NOT NULL,
  `password` varchar(20) NOT NULL DEFAULT 'password',
  `total_commission` decimal(8,2) NOT NULL DEFAULT '0.00',
  `address` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `quotes` (
  `quote_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `sa_id` varchar(20) NOT NULL,
  `date_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `customer_email` varchar(60) NOT NULL,
  `initial_total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `final_total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `finalized` tinyint NOT NULL DEFAULT '0',
  `sanctioned` tinyint NOT NULL DEFAULT '0',
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `commission` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ordered` tinyint NOT NULL DEFAULT '0',
  `quotescol` varchar(45) DEFAULT NULL,
  `additional_discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `order_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`quote_id`),
  KEY `sa_id_idx` (`sa_id`),
  CONSTRAINT `sa_id` FOREIGN KEY (`sa_id`) REFERENCES `sales_assoc` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `line_items` (
  `line_id` int NOT NULL AUTO_INCREMENT,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `secret_note` text,
  `quote_id` int NOT NULL,
  PRIMARY KEY (`line_id`,`quote_id`),
  KEY `quote_id_idx` (`quote_id`),
  CONSTRAINT `quote_id` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`quote_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `office_workers` (
  `id` varchar(25) NOT NULL,
  `first_name` varchar(25) NOT NULL,
  `last_name` varchar(25) NOT NULL,
  `password` varchar(20) NOT NULL DEFAULT 'password',
  `admin` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
