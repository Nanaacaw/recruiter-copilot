from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def run_startup_migrations() -> None:
    inspector = inspect(engine)

    if not inspector.has_table("interview_questions"):
        return

    interview_columns = {column["name"] for column in inspector.get_columns("interview_questions")}

    if "language" not in interview_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE interview_questions ADD COLUMN language VARCHAR(10) DEFAULT 'en'")
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
