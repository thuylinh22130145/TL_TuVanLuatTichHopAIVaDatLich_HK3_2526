from fastapi import Header, HTTPException, status
from app.core.config import settings


def verify_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")):
    """Xác thực request nội bộ từ server-api."""
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key không hợp lệ",
        )
    return True
