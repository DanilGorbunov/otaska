from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[schemas.ProjectOut])
def my_projects(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Project).filter(models.Project.user_id == user.id).all()


@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(body: schemas.ProjectCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    project = models.Project(user_id=user.id, **body.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: str, body: schemas.ProjectCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", response_model=schemas.SuccessResponse)
def delete_project(project_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Deleted"}


@router.post("/{project_id}/tasks", response_model=schemas.ProjectTaskOut, status_code=201)
def add_task(project_id: str, body: schemas.ProjectTaskCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    task = models.ProjectTask(project_id=project_id, **body.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{project_id}/tasks/{task_id}", response_model=schemas.ProjectTaskOut)
def update_task(project_id: str, task_id: str, body: schemas.ProjectTaskUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    task = (db.query(models.ProjectTask)
            .join(models.Project)
            .filter(models.ProjectTask.id == task_id, models.Project.id == project_id, models.Project.user_id == user.id)
            .first())
    if not task:
        raise HTTPException(404, "Task not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(task, k, v)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{project_id}/tasks/{task_id}", response_model=schemas.SuccessResponse)
def delete_task(project_id: str, task_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    task = (db.query(models.ProjectTask)
            .join(models.Project)
            .filter(models.ProjectTask.id == task_id, models.Project.id == project_id, models.Project.user_id == user.id)
            .first())
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Deleted"}


@router.post("/{project_id}/tasks/{task_id}/publish", response_model=schemas.EntryOut)
def publish_task_as_entry(project_id: str, task_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    task = (db.query(models.ProjectTask)
            .join(models.Project)
            .filter(models.ProjectTask.id == task_id, models.Project.id == project_id, models.Project.user_id == user.id)
            .first())
    if not task:
        raise HTTPException(404, "Task not found")

    entry = models.Entry(
        client_id=user.id,
        title=task.title,
        intent_type=models.IntentType.SEEKING_SERVICE,
        status=models.EntryStatus.OPEN,
    )
    db.add(entry)
    db.flush()
    task.entry_id = entry.id
    db.commit()
    db.refresh(entry)
    out = schemas.EntryOut.model_validate(entry)
    out.proposal_count = 0
    return out
