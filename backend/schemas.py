# backend/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# --- 1. CUENTAS (ACCOUNTS) ---
class AccountBase(BaseModel):
    name: str
    type: str # "Efectivo", "Debito", "Credito"
    balance: float

class AccountCreate(AccountBase):
    pass # Recibimos lo mismo que la base

class AccountResponse(AccountBase):
    id: int
    class Config:
        from_attributes = True

# --- 2. CATEGORÍAS (CATEGORIES) ---
class CategoryBase(BaseModel):
    name: str
    type: str # "Income" (Ingreso) o "Expense" (Gasto)
    budget_limit: float = 0.0
    icon: str = "💸"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# --- 3. TRANSACCIONES (TRANSACTIONS) ---
class TransactionBase(BaseModel):
    amount: float
    description: str
    category_id: int
    account_id: int

class TransactionCreate(TransactionBase):
    pass 

class TransactionResponse(TransactionBase):
    id: int
    date: datetime
    class Config:
        from_attributes = True