from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    port: int = 8000
    api_key: str = 'change-me-internal-key'
    rag_similarity_threshold: float = 0.35
    gemini_api_key: str = ''
    gemini_model: str = 'gemini-3.5-flash-lite'
    gemini_max_output_tokens: int = 1600
    data_dir: str = 'app/data'

    @property
    def data_path(self) -> Path:
        path = Path(self.data_dir)
        return path if path.is_absolute() else BASE_DIR / path


settings = Settings()
