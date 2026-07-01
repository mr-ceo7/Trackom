"""SMS character counter and part calculator for GSM-7 and Unicode UCS-2."""

import math

# Basic character set for GSM 03.38 (GSM-7)
GSM_7_BASIC = (
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./"
    "0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿"
    "abcdefghijklmnopqrstuvwxyzäöñüà"
)

# GSM-7 Extension characters that require an escape character (count as 2 slots)
GSM_7_EXTENSIONS = "^{}\\[~]|€"


def calculate_sms_parts(text: str) -> dict:
    """
    Calculate the number of SMS parts, character length (accounting for GSM-7 escape characters),
    and whether the message contains Unicode characters.
    
    Returns:
        dict: {
            "parts": int,
            "char_count": int,
            "is_unicode": bool,
            "limit_per_part": int
        }
    """
    if not text:
        return {
            "parts": 0,
            "char_count": 0,
            "is_unicode": False,
            "limit_per_part": 160
        }

    is_unicode = False
    char_count = 0

    for char in text:
        if char in GSM_7_BASIC:
            char_count += 1
        elif char in GSM_7_EXTENSIONS:
            char_count += 2  # Takes 2 GSM-7 characters (escape + character)
        else:
            is_unicode = True
            # In Unicode, length is based on UCS-2 characters
            break

    # If it is Unicode, we recalculate using standard string length
    if is_unicode:
        total_len = len(text)
        if total_len <= 70:
            parts = 1
            limit_per_part = 70
        else:
            limit_per_part = 67
            parts = math.ceil(total_len / 67)
    else:
        # GSM-7 message
        if char_count <= 160:
            parts = 1
            limit_per_part = 160
        else:
            limit_per_part = 153
            parts = math.ceil(char_count / 153)

    return {
        "parts": parts,
        "char_count": len(text) if is_unicode else char_count,
        "is_unicode": is_unicode,
        "limit_per_part": limit_per_part
    }
