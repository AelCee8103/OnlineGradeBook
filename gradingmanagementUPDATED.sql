-- ...existing code before validation_request...
DROP TABLE IF EXISTS `validation_request`;
CREATE TABLE IF NOT EXISTS validation_request (
requestID int(11) NOT NULL AUTO_INCREMENT,
advisoryID int(11) NOT NULL,
facultyID int(11) NOT NULL,
statusID int(11) NOT NULL DEFAULT 0,
requestDate datetime NOT NULL,
PRIMARY KEY (requestID) USING BTREE,
KEY FK_validation_request_advisory (advisoryID),
KEY FK_validation_request_validation_status (statusID),
KEY FK_validation_request_faculty (facultyID),
CONSTRAINT FK_validation_request_advisory FOREIGN KEY (advisoryID) REFERENCES advisory (advisoryID) ON DELETE NO ACTION ON UPDATE NO ACTION,
CONSTRAINT FK_validation_request_faculty FOREIGN KEY (facultyID) REFERENCES faculty (FacultyID) ON DELETE NO ACTION ON UPDATE NO ACTION,
CONSTRAINT FK_validation_request_validation_status FOREIGN KEY (statusID) REFERENCES validation_status (validation_statusID) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- ...existing code after validation_request, including INSERTs and other tables...