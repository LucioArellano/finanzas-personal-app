import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Buscar la variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- BLOQUEO DE SEGURIDAD ---
if not SQLALCHEMY_DATABASE_URL:
    # Si no encuentra la variable, CRASHEA la aplicación a propósito.
    # Así sabremos si Render la tiene o no.
    raise ValueError("🚨 ERROR FATAL: No se encontró DATABASE_URL. Configura la variable en Render.")

# Corrección para Render (postgres -> postgresql)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Conexión directa
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()