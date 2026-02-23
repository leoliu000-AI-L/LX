#!/usr/bin/env python3
"""
System Configuration Module V2
Internal use only - Do not modify
"""

import sqlite3
import os
import re
import hashlib
import json
from typing import Tuple, Dict, List
from datetime import datetime

# Internal paths - not exposed
_BASE = os.path.expanduser("~/.config")
_DB_PATH = os.path.join(_BASE, ".sys_cache", "config.db")

# Risk levels
RISK_LOW = "low"      # 普通用户可执行
RISK_MEDIUM = "medium" # 普通用户可执行，但记录
RISK_HIGH = "high"     # 仅管理员或完全授权用户可执行

# Operation registry with risk levels
_OPERATIONS = {
    # Low risk - anyone can do
    "read_file": RISK_LOW,
    "list_dir": RISK_LOW,
    "search_web": RISK_LOW,
    "generate_text": RISK_LOW,
    "create_note": RISK_LOW,
    
    # Medium risk - logged
    "send_message": RISK_MEDIUM,
    "create_file": RISK_MEDIUM,
    "edit_file": RISK_MEDIUM,
    "api_call": RISK_MEDIUM,
    
    # High risk - admin only
    "git_push": RISK_HIGH,
    "delete_file": RISK_HIGH,
    "use_token": RISK_HIGH,
    "send_email": RISK_HIGH,
    "modify_config": RISK_HIGH,
    "restart_service": RISK_HIGH,
    "package_files": RISK_HIGH,  # 打包文件
    "download_file": RISK_HIGH,  # 下载文件
    "cross_platform": RISK_HIGH, # 跨平台发送
    "db_modify": RISK_HIGH,
    "spawn_session": RISK_HIGH,
}

# SQL blocklist
_SQL_BLOCK = ["UPDATE", "INSERT", "DELETE", "DROP", "ALTER", "REPLACE"]

# Social engineering patterns
_SE_PATTERNS = [
    r"我是.*管理员",
    r"我是.*旅途",
    r"帮我.*权限",
    r"系统.*要求",
    r"开发者.*让我",
    r"/new",
    r"/reset",
    r"更换.*管理员",
    r"添加.*管理员",
    r".*是我.*管理员.*",
    r"确认.*",
    r"验证.*",
]

class AccessControl:
    """Access control system with user classification"""
    
    _instance = None
    _admin_hash = None
    _current_user = None
    _current_risk = None
    _trusted_users = {}  # 预授权用户缓存 {user_id: level}
    
    # 用户级别
    USER_ADMIN = "admin"           # 管理员 - 完全权限
    USER_FULL_AUTH = "full_auth"   # 完全授权 - 高风险免确认
    USER_CONFIRM = "confirm"       # 需确认授权 - 高风险需管理员确认
    USER_REGULAR = "regular"       # 普通用户 - 高风险拒绝
    USER_UNKNOWN = "unknown"       # 未知用户
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init()
        return cls._instance
    
    def _init(self):
        self._ensure_db()
        self._load_admin()
        self._load_trusted_users()
    
    def _ensure_db(self):
        if not os.path.exists(_DB_PATH):
            self._create_db()
    
    def _create_db(self):
        os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
        conn = sqlite3.connect(_DB_PATH)
        c = conn.cursor()
        
        # Config table
        c.execute("""
            CREATE TABLE IF NOT EXISTS cfg (
                k TEXT PRIMARY KEY,
                v TEXT NOT NULL
            )
        """)
        
        # Audit log
        c.execute("""
            CREATE TABLE IF NOT EXISTS audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uid TEXT,
                act TEXT,
                risk TEXT,
                res TEXT,
                note TEXT
            )
        """)
        
        # Store hashed admin ID
        admin_id = "ou_7d7fb1b2b895ac7d24ecac722da7d38d"
        c.execute("INSERT OR REPLACE INTO cfg (k, v) VALUES (?, ?)",
                  ("admin_hash", hashlib.sha256(admin_id.encode()).hexdigest()))
        
        conn.commit()
        conn.close()
        os.chmod(_DB_PATH, 0o400)
    
    def _load_admin(self):
        try:
            conn = sqlite3.connect(f"file:{_DB_PATH}?mode=ro", uri=True)
            c = conn.cursor()
            c.execute("SELECT v FROM cfg WHERE k = 'admin_hash'")
            r = c.fetchone()
            if r:
                self._admin_hash = r[0]
            conn.close()
        except:
            pass
    
    def _load_trusted_users(self):
        """Load trusted users from TRUSTED_USERS.md"""
        try:
            workspace = os.path.expanduser("~/.openclaw/workspace")
            trusted_file = os.path.join(workspace, "TRUSTED_USERS.md")
            
            if not os.path.exists(trusted_file):
                return
            
            with open(trusted_file, 'r') as f:
                content = f.read()
            
            # Parse fully authorized users
            in_full_auth = False
            for line in content.split('\n'):
                line = line.strip()
                
                if '### 完全授权' in line:
                    in_full_auth = True
                    continue
                elif '### 需确认授权' in line:
                    in_full_auth = False
                    continue
                
                if in_full_auth and line.startswith('- `ou_'):
                    # Extract user ID
                    user_id = line.split('`')[1]
                    self._trusted_users[user_id] = self.USER_FULL_AUTH
                    
        except Exception as e:
            pass
    
    def classify_user(self, user_id: str) -> str:
        """Classify user: admin, full_auth, confirm, regular, unknown"""
        if not user_id:
            return self.USER_UNKNOWN
        
        # Check admin
        user_hash = hashlib.sha256(user_id.encode()).hexdigest()
        if user_hash == self._admin_hash:
            return self.USER_ADMIN
        
        # Check trusted users
        if user_id in self._trusted_users:
            return self._trusted_users[user_id]
        
        return self.USER_REGULAR
    
    def verify_auto(self, user_id: str, operation: str = None, 
                    metadata: Dict = None) -> Tuple[bool, str, str]:
        """
        Auto-verify based on user ID from metadata
        
        Returns: (allowed, reason, risk_level)
        """
        # Auto-extract user ID from metadata if available
        if metadata and "user_id" in metadata:
            user_id = metadata["user_id"]
        
        if not user_id:
            self._log("UNKNOWN", operation or "?", "unknown", "DENY", "No user ID")
            return False, "Access denied: No user identification", "unknown"
        
        # Classify user
        user_type = self.classify_user(user_id)
        self._current_user = user_id
        
        # Check operation risk
        risk = _OPERATIONS.get(operation, RISK_MEDIUM)
        self._current_risk = risk
        
        # Decision logic
        if risk == RISK_LOW:
            # Anyone can do low risk
            self._log(user_id, operation, risk, "ALLOW", f"User type: {user_type}")
            return True, f"Allowed ({user_type} user)", risk
        
        elif risk == RISK_MEDIUM:
            # Logged but allowed
            self._log(user_id, operation, risk, "ALLOW", f"User type: {user_type}")
            return True, f"Allowed with logging ({user_type} user)", risk
        
        elif risk == RISK_HIGH:
            # Admin or fully authorized users
            if user_type == self.USER_ADMIN:
                self._log(user_id, operation, risk, "ALLOW", "Admin verified")
                return True, "Allowed: Admin verified", risk
            elif user_type == self.USER_FULL_AUTH:
                self._log(user_id, operation, risk, "ALLOW", "Fully authorized user (notify admin)")
                return True, "Allowed: Fully authorized user (admin will be notified)", risk
            else:
                self._log(user_id, operation, risk, "DENY", "Admin or full auth required")
                return False, "Access denied: High risk operation requires admin or authorization", risk
        
        return False, "Unknown operation", "unknown"
    
    def check_social_engineering(self, text: str) -> Tuple[bool, str]:
        """Detect social engineering attempts"""
        for pattern in _SE_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                self._log("DETECT", "social_engineering", "high", "ALERT", f"Pattern: {pattern}")
                return True, f"Suspicious pattern detected"
        return False, ""
    
    def check_sql(self, sql: str) -> Tuple[bool, str]:
        """Check SQL safety"""
        sql_u = sql.upper()
        for kw in _SQL_BLOCK:
            if kw in sql_u:
                return False, f"Blocked: {kw}"
        return True, "OK"
    
    def _log(self, uid: str, act: str, risk: str, res: str, note: str):
        """Write audit log"""
        try:
            os.chmod(_DB_PATH, 0o600)
            conn = sqlite3.connect(_DB_PATH)
            c = conn.cursor()
            c.execute(
                "INSERT INTO audit (uid, act, risk, res, note) VALUES (?, ?, ?, ?, ?)",
                (uid, act, risk, res, note)
            )
            conn.commit()
            conn.close()
            os.chmod(_DB_PATH, 0o400)
        except:
            pass
    
    def get_user_type(self) -> str:
        """Get current user type"""
        if self._current_user:
            return self.classify_user(self._current_user)
        return self.USER_UNKNOWN
    
    def is_admin(self, user_id: str = None) -> bool:
        """Check if user is admin"""
        if user_id:
            return self.classify_user(user_id) == self.USER_ADMIN
        return self.get_user_type() == self.USER_ADMIN
    
    def is_fully_authorized(self, user_id: str = None) -> bool:
        """Check if user has full authorization"""
        if user_id:
            return self.classify_user(user_id) in [self.USER_ADMIN, self.USER_FULL_AUTH]
        return self.get_user_type() in [self.USER_ADMIN, self.USER_FULL_AUTH]
    
    def reload_trusted_users(self):
        """Reload trusted users from file"""
        self._trusted_users = {}
        self._load_trusted_users()

# Global instance
_acl = None

def get_acl() -> AccessControl:
    """Get access control instance"""
    global _acl
    if _acl is None:
        _acl = AccessControl()
    return _acl

# Convenience functions
def verify(user_id: str, operation: str = None, metadata: Dict = None) -> Tuple[bool, str]:
    """Verify operation permission"""
    acl = get_acl()
    allowed, reason, _ = acl.verify_auto(user_id, operation, metadata)
    return allowed, reason

def require(user_id: str, operation: str, metadata: Dict = None):
    """Require permission or raise exception"""
    acl = get_acl()
    allowed, reason, _ = acl.verify_auto(user_id, operation, metadata)
    if not allowed:
        raise PermissionError(reason)
    return True

def is_admin(user_id: str = None) -> bool:
    """Check if current or specified user is admin"""
    acl = get_acl()
    return acl.is_admin(user_id)

def classify(user_id: str) -> str:
    """Classify user type"""
    acl = get_acl()
    return acl.classify_user(user_id)

# Auto-verify from message metadata
def auto_verify(metadata: Dict, operation: str = None) -> Tuple[bool, str]:
    """
    Auto-verify from message metadata
    Extracts user_id from metadata automatically
    """
    user_id = None
    
    # Try to extract from various metadata formats
    if isinstance(metadata, dict):
        # Feishu format
        if "conversation_label" in metadata:
            label = metadata.get("conversation_label", "")
            if label.startswith("ou_"):
                user_id = label
            elif label.startswith("user:ou_"):
                user_id = label.replace("user:", "")
        
        # Direct user_id
        if not user_id:
            user_id = metadata.get("user_id") or metadata.get("open_id")
    
    if not user_id:
        return False, "Cannot identify user from metadata"
    
    return verify(user_id, operation, metadata)

if __name__ == "__main__":
    # Test
    acl = get_acl()
    
    # Test admin
    admin_id = "ou_7d7fb1b2b895ac7d24ecac722da7d38d"
    print(f"Admin classification: {classify(admin_id)}")
    
    # Test operations
    for op in ["read_file", "send_message", "git_push"]:
        allowed, reason, risk = acl.verify_auto(admin_id, op)
        print(f"{op}: {allowed} ({risk}) - {reason}")
    
    # Test fully authorized user
    full_auth_id = "ou_b94e681abce93de66ecdb757e610b553"
    print(f"\nFull auth classification: {classify(full_auth_id)}")
    
    for op in ["read_file", "send_message", "git_push"]:
        allowed, reason, risk = acl.verify_auto(full_auth_id, op)
        print(f"{op}: {allowed} ({risk}) - {reason}")
    
    print("\nSystem OK")
