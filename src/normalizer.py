import re
from config.aliases import PRODUCT_ALIASES, VENDOR_ALIASES


def normalize_string(value: str) -> str:
    """Normalize general string: strip, casefold, and collapse whitespace."""
    if not value:
        return ""
    return " ".join(value.strip().casefold().split())


def normalize_product_name(value: str) -> str:
    """Normalize product name: strip, casefold, collapse whitespace, and apply alias registry."""
    if not value:
        return ""
    norm = normalize_string(value)
    # Check alias registry
    if norm in PRODUCT_ALIASES:
        return normalize_string(PRODUCT_ALIASES[norm])
    # Also check punctuation-stripped version (e.g. replace dashes/underscores with spaces)
    cleaned = normalize_string(re.sub(r'[-_]+', ' ', norm))
    if cleaned in PRODUCT_ALIASES:
        return normalize_string(PRODUCT_ALIASES[cleaned])
    return norm


def canonicalize_product_name(value: str) -> str:
    """Return the display-ready canonical product name if known, else original."""
    if not value:
        return ""
    norm = normalize_string(value)
    if norm in PRODUCT_ALIASES:
        return PRODUCT_ALIASES[norm]
    cleaned = normalize_string(re.sub(r'[-_]+', ' ', norm))
    if cleaned in PRODUCT_ALIASES:
        return PRODUCT_ALIASES[cleaned]
    return value.strip()


def normalize_vendor_name(value: str) -> str:
    """Normalize vendor name: strip, casefold, collapse whitespace, and apply vendor aliases."""
    if not value:
        return ""
    norm = normalize_string(value)
    if norm in VENDOR_ALIASES:
        return normalize_string(VENDOR_ALIASES[norm])
    return norm
