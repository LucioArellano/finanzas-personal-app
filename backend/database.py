import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 1. Buscamos si existe una URL de base de datos en la nube
# (Render nos dará esta URL automáticamente cuando despleguemos)
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Lógica de selección
if DATABASE_URL:
    # --- CONFIGURACIÓN PARA LA NUBE (PostgreSQL) ---
    # Fix pequeño: SQLAlchemy a veces necesita que diga 'postgresql' en vez de 'postgres'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(DATABASE_URL)
else:
    # --- CONFIGURACIÓN LOCAL (SQLite) ---
    SQLITE_URL = "sqlite:///./finance.db"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()