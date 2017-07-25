DROP DATABASE IF EXISTS bamazonDB;

CREATE DATABASE bamazonDB;

USE bamazonDB;

CREATE TABLE products (
  item_id INT NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(100) NULL,
  department_name VARCHAR(100) NULL,
  price_cents INT NULL,
  stock_quantity INT NULL,
  PRIMARY KEY (item_id)
);

CREATE TABLE user_inventory (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR (100) NOT NULL,
  item_id INT NOT NULL,
  quantity_owned INT NOT NULL,  
  PRIMARY KEY (id)
);