from fastapi import FastAPI, Depends
from .routes import auth
from .database import Base, engine
from .middleware.auth import get_current_user

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "API running 🚀"}


@app.get("/profile")
def profile(user: dict = Depends(get_current_user)):
    return {"user": user}

