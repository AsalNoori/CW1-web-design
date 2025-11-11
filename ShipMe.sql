CREATE DATABASE ShipMe;
USE ShipMe;
CREATE TABLE Users (UserID INT AUTO_INCREMENT PRIMARY KEY, FirstName VARCHAR(50), LastName VARCHAR(50), Email VARCHAR(100) UNIQUE, PhoneNumber VARCHAR(10) UNIQUE, Password VARCHAR(100));
INSERT INTO Users (FirstName, LastName, Email, PhoneNumber, Password) VALUES
('Alice', 'Johnson', 'alice.johnson@example.com', '0501234567', 'alice123');
CREATE TABLE IndividualOrders (
	OrderID INT AUTO_INCREMENT PRIMARY KEY, 
	TrackingID VARCHAR(20) UNIQUE,
	SenderFirstName VARCHAR(50) NOT NULL,     
	SenderLastName VARCHAR(50) NOT NULL,     
	SenderPhone VARCHAR(15) NOT NULL,     
	SenderEmail VARCHAR(100) NOT NULL,     
	ReceiverFirstName VARCHAR(50) NOT NULL,     
	ReceiverLastName VARCHAR(50) NOT NULL,     
	ReceiverPhone VARCHAR(15) NOT NULL,     
	ReceiverEmail VARCHAR(100) NOT NULL,     
	ReceiverAddress1 VARCHAR(100) NOT NULL,     
	ReceiverAddress2 VARCHAR(100) NOT NULL,     
	ReceiverAddress3 VARCHAR(100),     
	Height DECIMAL(6,2) NOT NULL,     
	Length DECIMAL(6,2) NOT NULL,     
	Width DECIMAL(6,2) NOT NULL,     
	Weight DECIMAL(6,2) NOT NULL,     
	Origin VARCHAR(50) NOT NULL,     
	Destination VARCHAR(50) NOT NULL,     
	ShippingMethod ENUM('Air', 'Sea') NOT NULL,     
	ShipmentCost DECIMAL(10,2),     
	OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);
CREATE TABLE BusinessOrders (
    BusinessID INT AUTO_INCREMENT PRIMARY KEY,
	TrackingID VARCHAR(20) UNIQUE,
    BusinessRegistration VARCHAR(50) NOT NULL,
    SenderPhone VARCHAR(15) NOT NULL,
    SenderEmail VARCHAR(100) NOT NULL,
    ReceiverFirstName VARCHAR(50) NOT NULL,
    ReceiverLastName VARCHAR(50) NOT NULL,
    ReceiverPhone VARCHAR(15) NOT NULL,
    ReceiverEmail VARCHAR(100) NOT NULL,
    ReceiverAddress1 VARCHAR(100) NOT NULL,
    ReceiverAddress2 VARCHAR(100) NOT NULL,
    ReceiverAddress3 VARCHAR(100),
    Height DECIMAL(6,2) NOT NULL,
    Length DECIMAL(6,2) NOT NULL,
    Width DECIMAL(6,2) NOT NULL,
    Weight DECIMAL(6,2) NOT NULL,
    Origin VARCHAR(50) NOT NULL,
    Destination VARCHAR(50) NOT NULL,
    ShippingMethod ENUM('Air', 'Sea') NOT NULL,
    ShipmentCost DECIMAL(10,2),
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
