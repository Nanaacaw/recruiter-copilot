import os
import json
import fitz
from docx import Document

from app.core.config import settings


class CVParserService:
    def parse(self, file_path: str) -> dict:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            text = self._parse_pdf(file_path)
        elif ext == ".docx":
            text = self._parse_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        return self._extract_structured_data(text)

    def _parse_pdf(self, file_path: str) -> str:
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text

    def _parse_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
                text += "\n"
        return text

    def _extract_structured_data(self, text: str) -> dict:
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        name = lines[0] if lines else "Unknown"
        email = ""
        phone = ""
        for line in lines[:10]:
            if "@" in line and not email:
                email = line.strip()
            if any(c.isdigit() for c in line) and ("+" in line or len([c for c in line if c.isdigit()]) >= 8) and not phone:
                phone = line.strip()

        return {
            "raw_text": text,
            "name": name,
            "email": email,
            "phone": phone,
            "sections": lines,
        }


cv_parser_service = CVParserService()
