from datetime import datetime, timezone
from typing import Dict

# Dictionary mapping jti (str) to expiration timestamp (datetime in UTC)
_blacklist: Dict[str, datetime] = {}

def blacklist_token(jti: str, expire: datetime):
    """Blacklist a token by its JWT ID (jti) until it expires."""
    _blacklist[jti] = expire
    _cleanup_blacklist()

def is_token_blacklisted(jti: str) -> bool:
    """Check if a JWT ID (jti) is in the blacklist and not yet expired."""
    if not jti:
        return False
    expire = _blacklist.get(jti)
    if expire:
        if datetime.now(timezone.utc) < expire:
            return True
        else:
            _blacklist.pop(jti, None)
    return False

def _cleanup_blacklist():
    """Remove expired tokens from the blacklist dictionary."""
    now = datetime.now(timezone.utc)
    expired_keys = [k for k, v in _blacklist.items() if v <= now]
    for k in expired_keys:
        _blacklist.pop(k, None)
