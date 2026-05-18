import asyncio
import logging

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from core.celery_app import celery_app
from core.config import settings

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_welcome_email_async(email: str, username: str):
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Hello, {username}! Welcome to Charnik Online!</h2>
            <p>We are very glad you joined us.</p>
            <p>You can now create characters, roll dice, and participate in campaigns.</p>
            <br>
            <p>May your rolls be critical!</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Welcome to Charnik Online!", recipients=[email], body=html, subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email(self, email: str, username: str):
    """
    Sends a welcome email to a new user.
    Retries up to 3 times on failure.
    """
    try:
        logger.info(f"Starting to send welcome email to {email}")
        asyncio.run(send_welcome_email_async(email, username))
        logger.info(f"Welcome email successfully sent to {email}")
    except Exception as e:
        logger.exception(f"Failed to send welcome email to {email}: {type(e).__name__}: {e}")
        retry_delay = 60 * (self.request.retries + 1)
        raise self.retry(exc=e, countdown=retry_delay)