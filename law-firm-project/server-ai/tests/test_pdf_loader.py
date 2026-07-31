import tempfile
import unittest
from pathlib import Path

from pypdf import PdfWriter
from pypdf.generic import (
    DecodedStreamObject,
    DictionaryObject,
    NameObject,
)

from app.services.document_loader import (
    PdfExtractionError,
    _read_pdf,
    load_documents_from_directory,
)


def create_text_pdf(path: Path, text: str) -> None:
    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)

    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    font_reference = writer._add_object(font)
    page[NameObject("/Resources")] = DictionaryObject(
        {
            NameObject("/Font"): DictionaryObject(
                {NameObject("/F1"): font_reference}
            )
        }
    )

    escaped_text = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = DecodedStreamObject()
    stream.set_data(
        f"BT /F1 12 Tf 72 720 Td ({escaped_text}) Tj ET".encode("latin-1")
    )
    page[NameObject("/Contents")] = writer._add_object(stream)

    with path.open("wb") as output:
        writer.write(output)


class PdfLoaderTests(unittest.TestCase):
    def test_extracts_real_text_and_page_number(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf_path = Path(directory) / "legal.pdf"
            create_text_pdf(
                pdf_path,
                "Legal document about land certificate",
            )

            content = _read_pdf(pdf_path)

            self.assertIn("[Trang 1]", content)
            self.assertIn("land certificate", content)
            self.assertNotIn("MOCK PDF", content)

    def test_rejects_non_pdf_file_with_pdf_extension(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf_path = Path(directory) / "invalid.pdf"
            pdf_path.write_text("not a pdf", encoding="utf-8")

            with self.assertRaisesRegex(
                PdfExtractionError,
                "header PDF",
            ):
                _read_pdf(pdf_path)

    def test_rejects_pdf_without_extractable_text(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf_path = Path(directory) / "scan.pdf"
            writer = PdfWriter()
            writer.add_blank_page(width=612, height=792)
            with pdf_path.open("wb") as output:
                writer.write(output)

            with self.assertRaisesRegex(
                PdfExtractionError,
                "OCR",
            ):
                _read_pdf(pdf_path)

    def test_directory_loader_skips_invalid_pdf_but_keeps_txt(self):
        with tempfile.TemporaryDirectory() as directory:
            data_path = Path(directory)
            (data_path / "invalid.pdf").write_text(
                "placeholder",
                encoding="utf-8",
            )
            (data_path / "valid.txt").write_text(
                "Nội dung pháp luật hợp lệ.",
                encoding="utf-8",
            )

            documents = load_documents_from_directory(data_path)

            self.assertEqual([document.doc_id for document in documents], ["valid"])


if __name__ == "__main__":
    unittest.main()
