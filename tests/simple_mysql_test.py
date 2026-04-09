import mysql.connector
conn = mysql.connector.connect(
    host='onlyoffice-mysql-server',
    user='onlyoffice_user',
    password='onlyoffice_pass',
    port=3306,
    database='docspace'
)
print('Connected!')
conn.close()