"""Email utility service for automated admin notifications."""

import asyncio
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


def _send_email_sync(to_email: str, subject: str, body_html: str) -> bool:
    """Synchronous email sending via SMTP. Runs in a thread pool — do NOT call directly from async code."""
    settings = get_settings()
    from app.routers.admin import load_system_settings
    sys_settings = load_system_settings()
    smtp_user = sys_settings.get("smtpUser") or settings.SMTP_USER
    smtp_password = sys_settings.get("smtpPassword") or settings.SMTP_PASSWORD

    logger.info(f"[EMAIL] Sending to {to_email}: {subject}")
    print(f"========================================================================\n"
          f"[EMAIL SENDING]\n"
          f"To: {to_email}\n"
          f"Subject: {subject}\n"
          f"Body: {body_html}\n"
          f"========================================================================")

    if not smtp_user or not smtp_password:
        logger.warning("SMTP credentials are not configured. Email dispatch skipped.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body_html, 'html'))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [to_email], msg.as_string())

        logger.info(f"Email sent successfully to {to_email}.")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


async def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """Sends an email asynchronously using a thread pool to avoid blocking the event loop."""
    return await asyncio.to_thread(_send_email_sync, to_email, subject, body_html)


def _send_bulk_email_sync(admin_emails: list, subject: str, body: str) -> None:
    """Synchronous bulk email sending via SMTP. Runs in a thread pool."""
    settings = get_settings()
    from app.routers.admin import load_system_settings
    sys_settings = load_system_settings()
    smtp_user = sys_settings.get("smtpUser") or settings.SMTP_USER
    smtp_password = sys_settings.get("smtpPassword") or settings.SMTP_PASSWORD

    if not smtp_user or not smtp_password:
        logger.warning("SMTP credentials are not configured. Email alert skipped.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = ", ".join(admin_emails)
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, admin_emails, msg.as_string())

        logger.info("Admin email alert sent successfully.")
    except Exception as e:
        logger.error(f"Failed to send admin email alert: {str(e)}")


async def send_admin_underfunded_alert(admin_emails: list, total_client_credits: int, system_balance: int):
    """Sends an SMTP email or prints a critical alert to logs if SMTP credentials are not set."""
    now = time.time()
    last_sent = _last_alert_sent.get("underfunded", 0)
    if now - last_sent < 3600:
        logger.info("Admin underfunded email alert throttled (sent recently).")
        return

    _last_alert_sent["underfunded"] = now

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

    await asyncio.to_thread(_send_bulk_email_sync, admin_emails, subject, body)


async def send_admin_api_failed_alert(admin_emails: list, total_client_credits: int, error_msg: str):
    """Sends an SMTP email or prints a warning to logs if SMTP credentials are not set."""
    now = time.time()
    last_sent = _last_alert_sent.get("api_failed", 0)
    if now - last_sent < 3600:
        logger.info("Admin API failed email alert throttled (sent recently).")
        return

    _last_alert_sent["api_failed"] = now

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

    await asyncio.to_thread(_send_bulk_email_sync, admin_emails, subject, body)


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
        await send_admin_api_failed_alert(admin_emails, total_client_credits, error_msg)

    # 3. Check condition
    if total_client_credits > system_balance:
        # Send/Log alert
        await send_admin_underfunded_alert(admin_emails, total_client_credits, system_balance)
        return True

    return False


def _generate_html_template(title: str, body: str, cta_text: str = None, cta_url: str = None) -> str:
    """Generates a professional, branded HTML email template for Trackom B2B."""
    cta_html = ""
    if cta_text and cta_url:
        cta_html = f"""
        <div style="text-align: center; margin-top: 30px;">
            <a href="{cta_url}" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">{cta_text}</a>
        </div>
        """
        
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Inter', 'Segoe UI', sans-serif; color: #cbd5e1; line-height: 1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border: 1px solid #334155; border-radius: 24px; max-width: 600px; width: 100%; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="padding: 30px 40px; border-bottom: 1px solid #334155; text-align: center; background-color: #1e293b;">
                                <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">TRACKOM B2B</h1>
                                <p style="color: #64748b; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Automated SaaS SMS Portal</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 700;">{title}</h2>
                                <div style="color: #94a3b8; font-size: 15px; margin-bottom: 20px;">
                                    {body}
                                </div>
                                {cta_html}
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px 40px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
                                <p style="color: #475569; font-size: 12px; margin: 0 0 10px 0;">
                                    © 2026 Trackom SaaS. All rights reserved.
                                </p>
                                <p style="color: #475569; font-size: 12px; margin: 0;">
                                    <a href="https://trackomgroup.com" style="color: #6366f1; text-decoration: none;">Visit trackomgroup.com</a>
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_welcome_email(email: str, name: str):
    """Sends a warm onboarding welcome email to new tenants."""
    subject = "Welcome to Trackom B2B SaaS! 🚀"
    body = f"""
    <p>Hello {name},</p>
    <p>We are absolutely thrilled to welcome you to the Trackom B2B family!</p>
    <p>Your tenant workspace has been set up successfully. You can now configure your SMS gateways, whitelist Sender IDs, build contact groups, and deploy high-speed notification dispatches or campaigns.</p>
    <p>To help you get started, we have credited your sandbox balance with test SMS credits.</p>
    <p>Should you need any assistance, our support team is always here to guide you.</p>
    """
    html_content = _generate_html_template("Your Tenant Account is Active!", body, "Go to Dashboard", "http://localhost:3000")
    await send_email(email, subject, html_content)


async def send_campaign_summary_email(email: str, name: str, campaign_name: str, status: str, delivered: int, failed: int, refund: int = 0):
    """Sends a summary email of campaign status changes."""
    is_success = status.lower() == "completed"
    subject = f"Campaign '{campaign_name}' {status.capitalize()}! " + ("🚀" if is_success else "❌")
    title = f"Campaign {status.capitalize()} Report"
    
    body = f"""
    <p>Hello {name},</p>
    <p>Your campaign <strong>'{campaign_name}'</strong> has finished processing.</p>
    <table cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 14px; color: #cbd5e1;">
        <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Campaign Name:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">{campaign_name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Status:</td>
            <td style="padding: 8px 0; font-weight: bold; color: {'#10b981' if is_success else '#ef4444'};">{status.upper()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Delivered:</td>
            <td style="padding: 8px 0; color: #ffffff;">{delivered:,}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Failed:</td>
            <td style="padding: 8px 0; color: #ffffff;">{failed:,}</td>
        </tr>
        {"<tr style='border-bottom: 1px solid #334155;'><td style='padding: 8px 0; font-weight: bold; color: #94a3b8;'>Refunded Credits:</td><td style='padding: 8px 0; color: #10b981; font-weight: bold;'>" + str(int(refund)) + " credits</td></tr>" if refund > 0 else ""}
    </table>
    <p>You can view full recipient metrics and delivery status reports in the dashboard.</p>
    """
    html_content = _generate_html_template(title, body, "View Campaign Reports", "http://localhost:3000/dashboard/campaigns")
    await send_email(email, subject, html_content)


async def send_low_balance_email(email: str, name: str, current_balance: int):
    """Sends a warning email that the user's wallet balance is low."""
    subject = "Action Required: Low Wallet Balance Alert ⚠️"
    body = f"""
    <p>Hello {name},</p>
    <p>This is an automated warning that your active SMS wallet balance is running low.</p>
    <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 15px; margin: 20px 0; text-align: center;">
        <span style="color: #94a3b8; font-size: 13px; text-transform: uppercase;">Current Balance</span>
        <div style="font-size: 28px; font-weight: 800; color: #ef4444; margin-top: 5px; font-family: monospace;">{current_balance:,} Credits</div>
    </div>
    <p>To avoid delivery timeouts, API failures, or campaign pauses, please top up your wallet via M-Pesa immediately.</p>
    """
    html_content = _generate_html_template("SMS Wallet Balance is Low", body, "Top Up Balance", "http://localhost:3000/dashboard/wallet")
    await send_email(email, subject, html_content)


async def send_security_alert_email(email: str, name: str, action: str, details: str = None):
    """Sends an email notification for critical security modifications."""
    subject = f"Trackom Security Alert: {action} 🔒"
    body = f"""
    <p>Hello {name},</p>
    <p>This is a security alert that a configuration modification has occurred on your Trackom account:</p>
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 15px; margin: 20px 0; color: #ffffff; font-size: 14px;">
        <strong>Activity:</strong> {action}<br/>
        {f"<strong>Details:</strong> {details}<br/>" if details else ""}
        <strong>Timestamp:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
    </div>
    <p><strong>If you did not perform this action</strong>, please reset your password immediately, revoke any suspicious API keys, and contact security support.</p>
    """
    html_content = _generate_html_template("Security Action Notification", body, "Manage Account Security", "http://localhost:3000/dashboard/settings?tab=security")
    await send_email(email, subject, html_content)
