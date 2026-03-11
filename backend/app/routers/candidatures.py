from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.repositories.candidature_repo import CandidatureRepository
from app.schemas.schemas import CandidatureCreate, CandidatureUpdate, CandidatureResponse
from typing import List
import openpyxl, csv, io

router = APIRouter()

@router.get("/", response_model=List[CandidatureResponse])
def get_all(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return CandidatureRepository(db).get_by_user(current_user.id)

@router.post("/", response_model=CandidatureResponse, status_code=201)
def create(data: CandidatureCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return CandidatureRepository(db).create(current_user.id, data)

@router.patch("/{cid}", response_model=CandidatureResponse)
def update(cid: str, data: CandidatureUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    repo = CandidatureRepository(db)
    c = repo.get_by_id(cid)
    if not c or c.utilisateur_id != current_user.id:
        raise HTTPException(404)
    return repo.update(cid, data.model_dump(exclude_none=True))

@router.delete("/{cid}", status_code=204)
def delete(cid: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    repo = CandidatureRepository(db)
    c = repo.get_by_id(cid)
    if not c or c.utilisateur_id != current_user.id:
        raise HTTPException(404)
    repo.delete(cid)

@router.get("/export")
def export(format: str = "xlsx", current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    candidatures = CandidatureRepository(db).get_by_user(current_user.id)
    if format == "xlsx":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Entreprise","Poste","Statut","Priorité","Score","Date"])
        for c in candidatures:
            ws.append([c.entreprise_manuelle or "", c.poste_manuel or "", c.statut, c.priorite, c.score_compatibilite or "", str(c.date_ajout)])
        buf = io.BytesIO(); wb.save(buf); buf.seek(0)
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=candidatures.xlsx"})
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Entreprise","Poste","Statut","Priorité","Score","Date"])
        for c in candidatures:
            writer.writerow([c.entreprise_manuelle or "", c.poste_manuel or "", c.statut, c.priorite, c.score_compatibilite or "", str(c.date_ajout)])
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=candidatures.csv"})
