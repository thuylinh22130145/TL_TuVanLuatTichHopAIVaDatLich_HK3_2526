from pydantic import BaseModel, Field


class DocumentListItem(BaseModel):
    doc_id: str
    title: str
    specialization: str
    file_name: str
    file_type: str
    size_bytes: int
    updated_at: str | None = None


class DocumentDetail(DocumentListItem):
    content: str


class DocumentCreate(BaseModel):
    doc_id: str = Field(..., min_length=2, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    title: str = Field(..., min_length=2, max_length=255)
    specialization: str = Field(..., min_length=2, max_length=255)
    content: str = Field(..., min_length=10)
    file_type: str = Field(default="txt", pattern=r"^(txt|pdf)$")


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    specialization: str | None = Field(default=None, min_length=2, max_length=255)
    content: str | None = Field(default=None, min_length=10)
