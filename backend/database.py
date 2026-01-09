import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Intentamos leer la URL de la base de datos desde las variables de entorno
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Si no existe (estamos en local), usamos SQLite
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# 3. FIX IMPORTANTE PARA RENDER:
# Render entrega la URL empezando con "postgres://", pero SQLAlchemy necesita "postgresql://"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configuración del motor
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Configuración para PostgreSQL
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()