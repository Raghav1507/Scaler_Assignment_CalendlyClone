from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Scaler Calendly Clone"
    # CORS origins as a list; in env, BACKEND_CORS_ORIGINS should be a JSON list,
    # e.g. ["https://your-app.vercel.app","http://localhost:5173"]
    backend_cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Example: mysql+pymysql://user:password@localhost:3306/scaler_calendly
    database_url: str = "mysql+pymysql://root:password@localhost:3306/scaler_calendly"

    # Optional email SMTP settings for notifications
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    email_from: str | None = None
    owner_email: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

