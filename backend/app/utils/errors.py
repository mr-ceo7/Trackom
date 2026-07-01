from fastapi import HTTPException

def api_error(status_code: int, detail: str, code: str = None) -> HTTPException:
    """Helper function for consistent error responses."""
    if code:
        return HTTPException(
            status_code=status_code,
            detail={"message": detail, "code": code}
        )
    return HTTPException(status_code=status_code, detail=detail)
