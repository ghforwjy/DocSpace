#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DocSpace 密码重置工具

此脚本用于生成 DocSpace 用户密码的哈希值，可用于重置数据库中的密码。

使用方法:
1. 修改下方的配置参数（machine_key, user_id, new_password）
2. 运行脚本: python reset_password.py
3. 使用输出的 SQL 语句更新数据库

注意: machine_key 必须与 appsettings.json 中的 core:machinekey 一致
"""

import hashlib
import base64

# ============== 配置参数 ==============
# 从 appsettings.json 中的 core:machinekey 获取
machine_key = "DocSpace2024CoreMachineKeyForEncryption123!"

# 要重置密码的用户ID
# 可通过 SQL 查询: SELECT id FROM core_user WHERE username='administrator';
user_id = "66faa6e4-f133-11ea-b126-00ffeec8b4ef"

# 新密码
new_password = "Admin@123"
# =====================================

def generate_password_hash(password: str, user_id: str, machine_key: str) -> str:
    """
    生成 DocSpace 密码哈希
    
    Args:
        password: 明文密码
        user_id: 用户ID (UUID)
        machine_key: 机器密钥
        
    Returns:
        Base64 编码的密码哈希
    """
    # 步骤1: 计算 Salt
    # salt = SHA256("{9450BEF7-7D9F-4E4F-A18A-971D8681722D}")
    salt_sha256 = hashlib.sha256("{9450BEF7-7D9F-4E4F-A18A-971D8681722D}".encode('utf-8')).digest()
    
    # PasswordHashSaltBytes = PBKDF2(machineConstant, salt, HMACSHA256, 100000, 32)
    password_hash_salt_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        machine_key.encode('utf-8'),
        salt_sha256,
        100000,
        32
    )
    salt = password_hash_salt_bytes.hex().lower()
    
    # 步骤2: 计算客户端密码哈希 (GetClientPassword)
    # hashBytes = PBKDF2(password, Salt, HMACSHA256, 100000, 32)
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000,
        32
    )
    hex_hash = hash_bytes.hex().lower()
    
    # 步骤3: 计算数据库存储的密码哈希 (GetPasswordHash)
    # pwdHash = Base64(SHA512(hexHash + userId + machineConstant))
    combined = hex_hash + user_id + machine_key
    pwd_hash = base64.b64encode(hashlib.sha512(combined.encode('utf-8')).digest()).decode('utf-8')
    
    return pwd_hash


def main():
    print("=" * 60)
    print("DocSpace 密码重置工具")
    print("=" * 60)
    print(f"用户ID: {user_id}")
    print(f"新密码: {new_password}")
    print("-" * 60)
    
    pwd_hash = generate_password_hash(new_password, user_id, machine_key)
    
    print(f"密码哈希: {pwd_hash}")
    print("-" * 60)
    print("SQL 更新语句:")
    print(f"UPDATE core_usersecurity SET pwdhash='{pwd_hash}' WHERE userid='{user_id}';")
    print("=" * 60)
    
    # Docker 命令示例
    print("\nDocker 执行命令:")
    print(f"docker exec onlyoffice-mysql-server mysql -uonlyoffice_user -ponlyoffice_pass docspace -e \"UPDATE core_usersecurity SET pwdhash='{pwd_hash}' WHERE userid='{user_id}';\"")


if __name__ == "__main__":
    main()
