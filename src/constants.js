export const VERSION = "3.1.1";
export const BUILD_DATE = "2026-03-31";
export const DEVELOPER = "Kasidit Wansudon";

export const SAMPLE_SQL = `CREATE TABLE users (
  id INT PRIMARY KEY,
  organization_id INT,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE organizations (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE roles (
  id INT PRIMARY KEY,
  organization_id INT,
  name VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE user_roles (
  id INT PRIMARY KEY,
  user_id INT,
  role_id INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE subscriptions (
  id INT PRIMARY KEY,
  name VARCHAR(150),
  description TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE invoices (
  id INT PRIMARY KEY,
  organization_id INT,
  subscription_id INT,
  invoice_date DATE,
  due_date DATE,
  amount DECIMAL(12,2),
  status ENUM('pending','paid','overdue'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE payments (
  id INT PRIMARY KEY,
  organization_id INT,
  subscription_id INT,
  amount DECIMAL(12,2),
  payment_method ENUM('credit_card','bank_transfer','cash'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE organization_subscriptions (
  id INT PRIMARY KEY,
  organization_id INT,
  subscription_id INT,
  status ENUM('active','inactive','cancelled'),
  billing_cycle ENUM('monthly','yearly'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);`;

export const FIELD_TYPES = ["int", "bigint", "varchar", "text", "decimal", "float", "date", "timestamp", "enum", "boolean", "json", "uuid"];
export const TC = { int: "#00d4ff", bigint: "#38bdf8", varchar: "#a78bfa", text: "#34d399", decimal: "#f59e0b", float: "#fbbf24", date: "#f472b6", timestamp: "#94a3b8", enum: "#fb923c", boolean: "#22d3ee", json: "#c084fc", uuid: "#67e8f9" };
export const DS = { varchar: "255", decimal: "10,2" };
