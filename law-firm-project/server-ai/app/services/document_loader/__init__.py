"""Public PDF/TXT loader API with compatibility handling for blank pages."""

from . import implementation as _implementation


_extract_page_text_original = _implementation._extract_page_text


def _extract_page_text(page) -> str:
    """Treat a page without a content stream as an empty/scanned page."""
    try:
        return _extract_page_text_original(page)
    except _implementation.PdfExtractionError as error:
        if isinstance(error.__cause__, KeyError):
            return ""
        raise


# The implementation resolves this global when _read_pdf processes each page.
_implementation._extract_page_text = _extract_page_text

DocumentLoadError = _implementation.DocumentLoadError
LawDocument = _implementation.LawDocument
PdfExtractionError = _implementation.PdfExtractionError
_read_pdf = _implementation._read_pdf
_read_txt = _implementation._read_txt
load_documents_from_directory = _implementation.load_documents_from_directory

__all__ = [
    "DocumentLoadError",
    "LawDocument",
    "PdfExtractionError",
    "_read_pdf",
    "_read_txt",
    "load_documents_from_directory",
]
