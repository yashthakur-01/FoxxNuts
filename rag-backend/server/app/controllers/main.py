"""
Backward compatibility facade for chunking module.
"""
from app.controllers.chunking import main, QualityReport

__all__ = ["main", "QualityReport"]
