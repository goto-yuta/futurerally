"""Sentry init + structured logging."""

import logging
import sys

import sentry_sdk
import structlog


def init(sentry_dsn: str | None) -> structlog.stdlib.BoundLogger:
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=0.0,
            profiles_sample_rate=0.0,
            send_default_pii=False,
        )

    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
    return structlog.get_logger()
