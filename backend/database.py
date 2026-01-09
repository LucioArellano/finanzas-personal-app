import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Obtenemos la URL de Render
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. LÓGICA DE CONEXIÓN ROBUSTA
if SQLALCHEMY_DATABASE_URL:
    # Estamos en la Nube (Render)
    # Corrección para que funcione en Render (postgres:// -> postgresql://)
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    print("✅ CONECTANDO A BASE DE DATOS POSTGRESQL EN LA NUBE")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

else:
    # Estamos en Local (Tu compu)
    print("⚠️  VARIABLE 'DATABASE_URL' NO ENCONTRADA. USANDO SQLITE LOCAL.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()