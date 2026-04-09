import pymysql

conn = pymysql.connect(
    host='onlyoffice-mysql-server',
    port=3306,
    user='root',
    password='my-secret-pw'
)

cursor = conn.cursor()
cursor.execute("SELECT user, host, plugin FROM mysql.user")
print("user, host, plugin")
for row in cursor.fetchall():
    print(row)

conn.close()