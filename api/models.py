# backend/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from api.database import Base
from datetime import datetime

# TABLA 1: CUENTAS (Bancos, Efectivo)
class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)   # Ej: "BBVA Nómina"
    type = Column(String)               # Ej: "Debit", "Cash"
    balance = Column(Float, default=0.0)
    
    # Relación inversa (para saber qué gastos hizo esta cuenta)
    transactions = relationship("Transaction", back_populates="account")

# TABLA 2: CATEGORÍAS (Comida, Casa)
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String) # "Income" o "Expense"
    budget_limit = Column(Float, default=0.0) # Tu límite mensual
    icon = Column(String, default="💸")

    transactions = relationship("Transaction", back_populates="category")

# TABLA 3: TRANSACCIONES (El historial)
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    
    # Llaves foráneas (Conexiones)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")