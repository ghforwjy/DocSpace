DROP USER IF EXISTS 'onlyoffice_user'@'%';
CREATE USER 'onlyoffice_user'@'%' IDENTIFIED BY 'onlyoffice_pass';
GRANT ALL PRIVILEGES ON docspace.* TO 'onlyoffice_user'@'%';
FLUSH PRIVILEGES;