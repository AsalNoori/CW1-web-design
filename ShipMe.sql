CREATE DATABASE ShipMe;
USE ShipMe;
CREATE TABLE Users (UserID INT AUTO_INCREMENT PRIMARY KEY, FirstName VARCHAR(50), LastName VARCHAR(50), Email VARCHAR(100) UNIQUE, PhoneNumber VARCHAR(10) UNIQUE, Password VARCHAR(100));
INSERT INTO Users (FirstName, LastName, Email, PhoneNumber, Password) VALUES
('Alice', 'Johnson', 'alice.johnson@example.com', '0501234567', 'alice123');