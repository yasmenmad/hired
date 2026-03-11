from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.repositories.user_repo import UserRepository
from app.schemas.schemas import ProfilUpdate, ProfilResponse, UserUpdate, UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return UserRepository(db).update(current_user.id, data.model_dump(exclude_none=True))

@router.get("/me/profil", response_model=ProfilResponse)
def get_profil(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return UserRepository(db).get_profil(current_user.id)

@router.put("/me/profil", response_model=ProfilResponse)
def update_profil(data: ProfilUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return UserRepository(db).update_profil(current_user.id, data.model_dump(exclude_none=True))
