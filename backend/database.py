import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Buscar la variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- ZONA DE DIAGNÓSTICO (Esto saldrá en los logs de Render) ---
print("--------------------------------------------------")
print("🔍 INICIANDO CONFIGURACIÓN DE BASE DE DATOS...")

if not SQLALCHEMY_DATABASE_URL:
    print("❌ ERROR GRAVE: NO SE ENCONTRÓ LA VARIABLE 'DATABASE_URL'")
    print("⚠️  EL SISTEMA USARÁ SQLITE TEMPORAL (LOS DATOS SE BORRARÁN AL REINICIAR)")
    # Configuración de emergencia (SQLite)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    print("✅ VARIABLE ENCONTRADA. CONECTANDO A POSTGRESQL...")
    # Corrección para Render
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        print("🚀 MOTOR DE BASE DE DATOS INICIADO CORRECTAMENTE")
    except Exception as e:
        print(f"🔥 ERROR AL CONECTAR CON POSTGRES: {e}")

print("--------------------------------------------------")
# -----------------------------------------------------------

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()