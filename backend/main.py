import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse
import calendar
from sqlalchemy import extract
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# --- 1. CONFIGURACIÓN DE BASE DE DATOS ---
DATABASE_URL = "sqlite:///./finanzas.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. MODELOS (TABLAS DE LA BD) ---
class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)  
    balance = Column(Float, default=0.0)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)
    icon = Column(String, default="💸")
    budget_limit = Column(Float, default=0.0)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String)
    date = Column(DateTime, default=datetime.now)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    target_amount = Column(Float)
    current_amount = Column(Float, default=0.0)
    icon = Column(String, default="🎯")
    deadline = Column(String, nullable=True)

# Crear las tablas automáticamente
Base.metadata.create_all(bind=engine)

# --- 3. ESQUEMAS PYDANTIC (VALIDACIÓN DE DATOS) ---
class AccountCreate(BaseModel):
    name: str 
    type: str 
    balance: float

class CategoryCreate(BaseModel):
    name: str
    type: str
    icon: Optional[str] = "💸"
    budget_limit: Optional[float] = 0.0

class TransactionCreate(BaseModel):
    amount: float
    description: str
    account_id: int
    category_id: int

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    icon: str = "🎯"
    deadline: Optional[str] = None

# --- 4. CONFIGURACIÓN DE LA APP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. ENDPOINTS (RUTAS) ---

# --- CUENTAS ---
@app.post("/accounts/")
def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    db_account = Account(name=account.name, type=account.type, balance=account.balance)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@app.get("/accounts/")
def read_accounts(db: Session = Depends(get_db)):
    return db.query(Account).all()

@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    # 1. Buscar la cuenta
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # 2. SEGURIDAD: Verificar si tiene transacciones
    tx_check = db.query(Transaction).filter(Transaction.account_id == account_id).first()
    if tx_check:
        raise HTTPException(status_code=400, detail="No se puede borrar: Tiene movimientos asociados")

    # 3. Borrar
    db.delete(acc)
    db.commit()
    return {"message": "Cuenta eliminada"}

# --- CATEGORÍAS ---
@app.post("/categories/")
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    # Evitar duplicados de nombre
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="La categoría ya existe")
    
    db_category = Category(
        name=category.name, 
        type=category.type, 
        icon=category.icon, 
        budget_limit=category.budget_limit
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/categories/")
def read_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    # 1. Buscar categoría
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # 2. Verificar si tiene transacciones hijas
    tx_check = db.query(Transaction).filter(Transaction.category_id == category_id).first()
    if tx_check:
        raise HTTPException(status_code=400, detail="No se puede borrar: Tiene gastos asociados")

    # 3. Borrar
    db.delete(cat)
    db.commit()
    return {"message": "Categoría eliminada"}

# --- TRANSACCIONES ---
@app.post("/transactions/")
def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == tx.account_id).first()
    category = db.query(Category).filter(Category.id == tx.category_id).first()

    if not account or not category:
        raise HTTPException(status_code=404, detail="Cuenta o Categoría no encontrada")

    # Actualizar saldo de la cuenta
    if category.type == "Expense":
        account.balance -= tx.amount
    else:
        account.balance += tx.amount

    db_tx = Transaction(
        amount=tx.amount,
        description=tx.description,
        account_id=tx.account_id,
        category_id=tx.category_id
    )
    db.add(db_tx)
    db.commit()
    return {"message": "Transacción guardada"}

@app.get("/transactions/")
def read_transactions(
    month: Optional[int] = None, 
    year: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    if month and year:
        # Calcular el rango de fechas del mes seleccionado
        # Primer día del mes
        start_date = datetime(year, month, 1)
        # Último día del mes
        last_day = calendar.monthrange(year, month)[1]
        end_date = datetime(year, month, last_day, 23, 59, 59)

        # Filtrar
        query = query.filter(Transaction.date >= start_date, Transaction.date <= end_date)

    return query.all()

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    account = db.query(Account).filter(Account.id == tx.account_id).first()
    category = db.query(Category).filter(Category.id == tx.category_id).first()
    
    # Revertir saldo al borrar transacción
    if account and category:
        if category.type == "Expense":
            account.balance += tx.amount
        else:
            account.balance -= tx.amount
    
    db.delete(tx)
    db.commit()
    return {"message": "Transacción eliminada"}

# --- METAS (GOALS) ---
@app.get("/goals/")
def read_goals(db: Session = Depends(get_db)):
    return db.query(Goal).all()

@app.post("/goals/")
def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    db_goal = Goal(
        name=goal.name, 
        target_amount=goal.target_amount, 
        current_amount=goal.current_amount, 
        icon=goal.icon, 
        deadline=goal.deadline
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    
    db.delete(goal)
    db.commit()
    return {"message": "Meta eliminada"}

@app.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, tx_update: TransactionCreate, db: Session = Depends(get_db)):
    # 1. Buscar la transacción original
    db_tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    # 2. REVERTIR el saldo antiguo (Como si nunca hubiera pasado)
    old_account = db.query(Account).filter(Account.id == db_tx.account_id).first()
    old_category = db.query(Category).filter(Category.id == db_tx.category_id).first()

    if old_account and old_category:
        if old_category.type == "Expense":
            old_account.balance += db_tx.amount # Devolvemos el dinero gastado
        else:
            old_account.balance -= db_tx.amount # Quitamos el dinero ingresado

    # 3. APLICAR el nuevo saldo (Con los datos corregidos)
    new_account = db.query(Account).filter(Account.id == tx_update.account_id).first()
    new_category = db.query(Category).filter(Category.id == tx_update.category_id).first()

    if not new_account or not new_category:
        raise HTTPException(status_code=404, detail="Nueva cuenta o categoría no encontrada")

    if new_category.type == "Expense":
        new_account.balance -= tx_update.amount
    else:
        new_account.balance += tx_update.amount

    # 4. Actualizar los datos de la transacción
    db_tx.amount = tx_update.amount
    db_tx.description = tx_update.description
    db_tx.account_id = tx_update.account_id
    db_tx.category_id = tx_update.category_id
    
    db.commit()
    return {"message": "Transacción actualizada correctamente"}

@app.get("/analysis/")
def get_analysis(month: int, year: int, db: Session = Depends(get_db)):
    # 1. Obtener transacciones del mes
    # (Usamos la misma lógica de fechas que en transactions)
    if month == 12:
        next_month = 1
        next_year = year + 1
    else:
        next_month = month + 1
        next_year = year
    
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{next_year}-{next_month:02d}-01"

    txs = db.query(Transaction).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date
    ).all()

    if not txs:
        return {"message": "Aun no hay datos suficientes para analizar este mes. ¡Registra algo!"}

    # 2. Calcular Totales
    total_income = 0
    total_expense = 0
    category_totals = {}

    for tx in txs:
        cat = db.query(Category).filter(Category.id == tx.category_id).first()
        if cat:
            if cat.type == "Income":
                total_income += tx.amount
            elif cat.type == "Expense":
                total_expense += tx.amount
                # Agrupar gastos por categoría
                category_totals[cat.name] = category_totals.get(cat.name, 0) + tx.amount

    # 3. Generar Diagnóstico (Lógica "Inteligente")
    savings = total_income - total_expense
    savings_rate = (savings / total_income * 100) if total_income > 0 else 0
    
    # Encontrar la categoría de mayor gasto
    top_category = max(category_totals, key=category_totals.get) if category_totals else "Ninguna"
    top_amount = category_totals[top_category] if category_totals else 0

    advice = ""
    
    # Escenario A: Gastaste más de lo que ganaste
    if savings < 0:
        advice = f"⚠️ Cuidado: Este mes has gastado ${abs(savings):,.0f} más de lo que ingresaste. Tu mayor fuga de dinero fue en '{top_category}' (${top_amount:,.0f}). Intenta reducir gastos hormiga."
    
    # Escenario B: Ahorro bajo (0-10%)
    elif savings_rate < 10:
        advice = f"😐 Estás en números verdes, pero tu ahorro es bajo ({savings_rate:.1f}%). La categoría '{top_category}' se llevó gran parte de tu dinero. ¡Intenta subir ese porcentaje el próximo mes!"
    
    # Escenario C: Ahorro saludable (10-30%)
    elif 10 <= savings_rate < 30:
        advice = f"👍 ¡Buen trabajo! Ahorraste el {savings_rate:.0f}% de tus ingresos. Mantienes un buen equilibrio. Si inviertes esos ${savings:,.0f}, podrías acelerar tus metas."
    
    # Escenario D: Ahorro excelente (>30%)
    else:
        advice = f"🚀 ¡Impresionante! Estás ahorrando el {savings_rate:.0f}% de lo que ganas. Eres un máster de las finanzas. Considera mover el excedente a una cuenta de Inversión."

    return {"message": advice}

# --- PEGAR AL FINAL DE backend/main.py ---

@app.get("/export")
def export_data(db: Session = Depends(get_db)):
    # 1. Obtener datos cruzando tablas (Joins)
    # Queremos el NOMBRE de la categoría y cuenta, no solo el ID
    results = db.query(
        Transaction.date,
        Transaction.description,
        Transaction.amount,
        Category.name.label("category_name"),
        Category.type.label("category_type"),
        Account.name.label("account_name")
    ).join(Category, Transaction.category_id == Category.id)\
     .join(Account, Transaction.account_id == Account.id)\
     .all()

    # 2. Convertir a lista de diccionarios (Formato para Pandas)
    data = []
    for row in results:
        data.append({
            "Fecha": row.date,
            "Descripción": row.description,
            "Monto": row.amount,
            "Tipo": "Ingreso" if row.category_type == "Income" else "Gasto",
            "Categoría": row.category_name,
            "Cuenta": row.account_name
        })

    # 3. Crear DataFrame de Pandas
    df = pd.DataFrame(data)

    # 4. Guardar en memoria como Excel (sin crear archivo en disco)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Movimientos")
    
    output.seek(0)

    # 5. Enviar respuesta como descarga
    headers = {"Content-Disposition": "attachment; filename=mis_finanzas.xlsx"}
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)