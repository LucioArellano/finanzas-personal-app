# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- CONFIGURACIÓN DE LA BASE DE DATOS ---
# Usaremos SQLite por ahora (se creará un archivo 'finanzas.db' en tu carpeta)
SQLALCHEMY_DATABASE_URL = "sqlite:///./finanzas.db"

# Si luego usas PostgreSQL, solo cambiarás la línea de arriba por algo como:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"

# El motor que hace la magia
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# La sesión para hablar con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La clase base para nuestros modelos
Base = declarative_base()