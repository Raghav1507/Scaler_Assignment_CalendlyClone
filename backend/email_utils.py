from __future__ import annotations

import smtplib
from email.message import EmailMessage
from typing import Iterable

from .config import settings


def _is_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_port and settings.email_from)


def send_email(subject: str, body: str, recipients: Iterable[str]) -> None:
    """
    Best‑effort SMTP sender. If SMTP is not configured, this is a no‑op.
    """
    if not _is_configured():
        return

    to_list = [r for r in recipients if r]
    if not to_list:
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.email_from
    msg["To"] = ", ".join(to_list)
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
    except Exception:
        # For this assignment we don't want email errors to break booking.
        return

