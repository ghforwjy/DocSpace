import hashlib
import base64
import struct

# 配置参数
machine_key = "DocSpace2024CoreMachineKeyForEncryption123!"
user_id = "66faa6e4-f133-11ea-b126-00ffeec8b4ef"
new_password = "Admin@123"  # 新密码

# 步骤1: 计算 Salt
# salt = SHA256("{9450BEF7-7D9F-4E4F-A18A-971D8681722D}")
salt_sha256 = hashlib.sha256("{9450BEF7-7D9F-4E4F-A18A-971D8681722D}".encode('utf-8')).digest()

# PasswordHashSaltBytes = PBKDF2(machineConstant, salt, HMACSHA256, 100000, 32)
# 注意: Python 的 hashlib.pbkdf2_hmac 参数顺序是 (password, salt, iterations, dklen)
# 但 .NET 的 KeyDerivation.Pbkdf2 参数顺序是 (password, salt, prf, iterations, dklen)
# 所以我们需要用 machine_key 作为 password，salt_sha256 作为 salt
import hashlib
password_hash_salt_bytes = hashlib.pbkdf2_hmac(
    'sha256',
    machine_key.encode('utf-8'),  # password
    salt_sha256,                   # salt
    100000,                        # iterations
    32                             # dklen (256 bits / 8 = 32 bytes)
)
salt = password_hash_salt_bytes.hex().lower()
print(f"Salt: {salt}")

# 步骤2: 计算客户端密码哈希 (GetClientPassword)
# hashBytes = PBKDF2(password, Salt, HMACSHA256, 100000, 32)
hash_bytes = hashlib.pbkdf2_hmac(
    'sha256',
    new_password.encode('utf-8'),  # password
    salt.encode('utf-8'),           # salt (十六进制字符串)
    100000,                         # iterations
    32                              # dklen
)
hex_hash = hash_bytes.hex().lower()
print(f"Hex hash (GetClientPassword result): {hex_hash}")

# 步骤3: 计算数据库存储的密码哈希 (GetPasswordHash)
# pwdHash = Base64(SHA512(hexHash + userId + machineConstant))
combined = hex_hash + user_id + machine_key
pwd_hash = base64.b64encode(hashlib.sha512(combined.encode('utf-8')).digest()).decode('utf-8')
print(f"Password hash (for database): {pwd_hash}")

# 输出 SQL 更新语句
print(f"\nSQL to update password:")
print(f"UPDATE core_usersecurity SET pwdhash='{pwd_hash}' WHERE userid='{user_id}';")
