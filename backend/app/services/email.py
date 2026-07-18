"""Email utility service for automated admin notifications."""

import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from sqlalchemy import select, func

from app.config import get_settings
from app.models.user import User

logger = logging.getLogger("trackom.email")

# Cache to prevent duplicate email alerts in quick succession (throttle to once per hour)
_last_alert_sent = {}

def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """Sends an email using configured SMTP settings, fallback to console logging."""
    settings = get_settings()
    logger.info(f"[EMAIL] Sending to {to_email}: {subject}")
    print(f"========================================================================\n"
          f"[EMAIL SENDING]\n"
          f"To: {to_email}\n"
          f"Subject: {subject}\n"
          f"Body: {body_html}\n"
          f"========================================================================")
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials are not configured. Email dispatch skipped.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body_html, 'html'))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, [to_email], msg.as_string())
            
        logger.info(f"Email sent successfully to {to_email}.")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_admin_underfunded_alert(admin_emails: list, total_client_credits: int, system_balance: int):
    """Sends an SMTP email or prints a critical alert to logs if SMTP credentials are not set."""
    now = time.time()
    last_sent = _last_alert_sent.get("underfunded", 0)
    if now - last_sent < 3600:
        logger.info("Admin underfunded email alert throttled (sent recently).")
        return
        
    _last_alert_sent["underfunded"] = now
    
    settings = get_settings()
    subject = "⚠️ CRITICAL ALERT: Trackom Gateway Pool Underfunded"
    body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: sans-serif; line-height: 1.5; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }}
            .alert-header {{ color: #e11d48; font-size: 20px; font-weight: bold; margin-bottom: 15px; }}
            .metrics-list {{ background-color: #f9fafb; padding: 15px; border-radius: 6px; list-style-type: none; }}
            .metrics-list li {{ margin-bottom: 8px; }}
            .footer {{ margin-top: 25px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="alert-header">⚠️ Trackom SaaS Administrator Alert</div>
            <p>This is an automated system notification that the platform's live SMS gateway pool is currently underfunded relative to outstanding client balances.</p>
            <ul class="metrics-list">
                <li><b>Outstanding Client Credits Sold:</b> {total_client_credits:,} credits</li>
                <li><b>Master Gateway Pool Balance:</b> {system_balance:,} credits</li>
            </ul>
            <p><b>Status:</b> Live SMS dispatches for all clients have been temporarily held/suspended to prevent unsent provider failures.</p>
            <p><b>Action Required:</b> Please log in to your AdvantaSMS gateway panel and purchase additional credits to top up the master gateway pool.</p>
            <div class="footer">
                <p>Best regards,<br/>Trackom SaaS Automated Monitor</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Log to server console/logs in all environments
    logger.error(f"[EMAIL ALERT] to {admin_emails}: {subject} - Credits Out: {total_client_credits}, Pool: {system_balance}")
    print(f"========================================================================\n"
          f"[EMAIL ALERT SENDING]\n"
          f"To: {admin_emails}\n"
          f"Subject: {subject}\n"
          f"Body: {body}\n"
          f"========================================================================")
          
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials are not configured. Email alert skipped.")
        return
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = ", ".join(admin_emails)
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, admin_emails, msg.as_string())
            
        logger.info("Admin underfunded email alert sent successfully.")
    except Exception as e:
        logger.error(f"Failed to send admin email alert: {str(e)}")


def send_admin_api_failed_alert(admin_emails: list, total_client_credits: int, error_msg: str):
    """Sends an SMTP email or prints a warning to logs if SMTP credentials are not set."""
    now = time.time()
    last_sent = _last_alert_sent.get("api_failed", 0)
    if now - last_sent < 3600:
        logger.info("Admin API failed email alert throttled (sent recently).")
        return
        
    _last_alert_sent["api_failed"] = now
    
    settings = get_settings()
    subject = "⚠️ WARNING: Trackom Gateway Pool Check Failed"
    body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: sans-serif; line-height: 1.5; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }}
            .alert-header {{ color: #ea580c; font-size: 20px; font-weight: bold; margin-bottom: 15px; }}
            .metrics-list {{ background-color: #f9fafb; padding: 15px; border-radius: 6px; list-style-type: none; }}
            .metrics-list li {{ margin-bottom: 8px; }}
            .footer {{ margin-top: 25px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="alert-header">⚠️ Trackom SaaS Administrator Warning</div>
            <p>This is an automated system notification that the platform failed to verify the live SMS gateway pool balance.</p>
            <p><b>Error Details:</b> {error_msg}</p>
            <ul class="metrics-list">
                <li><b>Outstanding Client Credits Sold:</b> {total_client_credits:,} credits</li>
                <li><b>Current Fallback Value:</b> 10,000,000 credits (Fail-Open)</li>
            </ul>
            <p><b>Status:</b> Live SMS dispatches are operating in a fail-open mode using the fallback balance. Client traffic is NOT currently blocked, but gateway underfunding cannot be checked.</p>
            <p><b>Action Required:</b> Please inspect your connection to the AdvantaSMS gateway APIs immediately.</p>
            <div class="footer">
                <p>Best regards,<br/>Trackom SaaS Automated Monitor</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    logger.warning(f"[EMAIL WARNING] to {admin_emails}: {subject} - Error: {error_msg}")
    print(f"========================================================================\n"
          f"[EMAIL ALERT SENDING]\n"
          f"To: {admin_emails}\n"
          f"Subject: {subject}\n"
          f"Body: {body}\n"
          f"========================================================================")
          
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials are not configured. Email warning skipped.")
        return
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = ", ".join(admin_emails)
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, admin_emails, msg.as_string())
            
        logger.info("Admin API failed email alert sent successfully.")
    except Exception as e:
        logger.error(f"Failed to send admin API failed email alert: {str(e)}")


async def check_and_enforce_gateway_liquidity(db) -> bool:
    """
    Checks if outstanding client credits sold exceed the master gateway pool balance.
    If yes, triggers an admin alert email and returns True (should block dispatch).
    Otherwise returns False.
    """
    # 1. Calculate outstanding client credits (sum of live sms_balance of all active non-admin users)
    res_client_credits = await db.execute(select(func.sum(User.sms_balance)).where(User.is_superuser == False))
    total_client_credits = int(res_client_credits.scalar() or 0)
    
    # 2. Retrieve AdvantaSMS master gateway balance
    from app.services.sms_gateway import AdvantaSMSGateway
    gateway = AdvantaSMSGateway()
    system_balance = 10000000  # Default fallback if API fails
    api_failed = False
    error_msg = ""
    try:
        balance_data = await gateway.check_balance(timeout=2.0)
        if balance_data and "credit" in balance_data:
            system_balance = int(float(balance_data["credit"]))
    except Exception as e:
        api_failed = True
        error_msg = str(e)
        logger.warning(f"Advanta SMS gateway balance check failed: {e}. Defaulting to fail-open.")
        
    # Fetch all admin emails to notify (needed for alerts)
    res_admins = await db.execute(select(User.email).where(User.is_superuser == True))
    admin_emails = [email for email in res_admins.scalars().all()]
    if not admin_emails:
        admin_emails = ["admin@trackomgroup.com"] # Fallback

    if api_failed:
        # Trigger alert email about check failure (throttled)
        send_admin_api_failed_alert(admin_emails, total_client_credits, error_msg)
        
    # 3. Check condition
    if total_client_credits > system_balance:
        # Send/Log alert
        send_admin_underfunded_alert(admin_emails, total_client_credits, system_balance)
        return True
        
    return False
