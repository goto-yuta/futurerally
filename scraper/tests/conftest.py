"""Shared test fixtures."""

import pytest

from futurerally_scraper.config import Settings


@pytest.fixture
def settings():
    return Settings(database_url="postgresql://test/test")
