from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import json

security = HTTPBearer()
SECRET_KEY = "secret"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print("DEBUG - Token payload:",
              json.dumps(payload, indent=2))  # Debug log
        return {
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "name": payload.get("name")
        }
    except Exception as e:
        print(f"DEBUG - Token decode error: {e}")  # Debug log
        raise HTTPException(status_code=401, detail="Invalid token")
