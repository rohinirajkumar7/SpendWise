import re
import spacy
from dateutil import parser as dateparser

# Load the spaCy small model for Named Entity Recognition (NER)
nlp = spacy.load('en_core_web_sm')

# Matches a single numeric token, optionally preceded/followed by a currency marker.
# Deliberately loose ('\d[\d,.]*\d') rather than a strict thousands-grouping
# pattern: OCR output is noisy (e.g. '5363,.99', '1,139.00', '119.05') and a
# strict grouping regex silently truncates at the first char that breaks the
# pattern. We capture the whole numeric run here and let _normalize_amount
# below decide what the separators mean.
AMOUNT_RE = re.compile(
    r'(?P<cur>INR|Rs\.?|₹|USD|EUR|\$)?\s*'
    r'(?P<amt>\d[\d,.]*\d|\d)'
    r'\s*(?P<cur2>INR|Rs\.?|₹|USD|EUR)?',
    re.I
)

# Lines that mention these are almost certainly the line with the final payable
# amount, in priority order (checked top to bottom).
TOTAL_KEYWORDS = [
    r'grand\s*total',
    r'net\s*(payable|amount)',
    r'amount\s*due',
    r'balance\s*due',
    r'total\s*due',
    r'\btotal\b',
    r'amount\s*paid',
]

# Lines matching these should never be treated as "the merchant name" or scanned
# for the total, since they're clearly something else.
NON_MERCHANT_LINE_RE = re.compile(
    r'(receipt|invoice|order|bill\s*no|gstin|tax\s*invoice|cashier|table|date|time|'
    r'phone|tel|www\.|http|@|\d{3,}[-\s]?\d{3,}[-\s]?\d{3,})',
    re.I
)

DATE_LINE_HINT_RE = re.compile(
    r'(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4})|'
    r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b',
    re.I
)


def _normalize_amount(raw: str):
    """Turn a noisy numeric token into a float.

    Real-world OCR output on thermal receipts routinely mangles the
    separator between the whole and fractional part - '1,139.00' is clean,
    but '5363,.99' (comma glued right next to the decimal point) and similar
    artifacts are common. Rather than requiring a specific grouping shape
    up front (which just truncates on anything unexpected), we take the
    LAST '.' or ',' in the token as the decimal point only when it's
    followed by exactly 1-2 digits (a plausible cents/paise amount) and
    strip every other separator as thousands-grouping/noise.
    """
    cleaned = re.sub(r'[^\d.,]', '', raw)
    if not cleaned:
        return None

    last_sep_pos = max(cleaned.rfind('.'), cleaned.rfind(','))
    if last_sep_pos != -1:
        decimals = cleaned[last_sep_pos + 1:]
        if 1 <= len(decimals) <= 2:
            whole = re.sub(r'[.,]', '', cleaned[:last_sep_pos])
            if whole:
                try:
                    return float(f'{whole}.{decimals}')
                except ValueError:
                    pass

    digits_only = re.sub(r'[.,]', '', cleaned)
    if not digits_only:
        return None
    try:
        return float(digits_only)
    except ValueError:
        return None


def _find_amount_in_line(line: str):
    """Return (amount, currency) for the first plausible amount in a line, or (None, None)."""
    for m in AMOUNT_RE.finditer(line):
        amt_raw = m.group('amt')
        cur = m.group('cur') or m.group('cur2')
        digits_only = re.sub(r'\D', '', amt_raw)
        has_decimal_marker = '.' in amt_raw or ',' in amt_raw
        # Skip bare single/double digit numbers with no currency and no decimal -
        # these are usually item counts/quantities, not money.
        if cur is None and not has_decimal_marker and len(digits_only) <= 2:
            continue
        amount = _normalize_amount(amt_raw)
        if amount is None:
            continue
        return amount, (cur or 'INR')
    return None, None


def extract_entities(text: str):
    doc = nlp(text)
    entities = {}
    for ent in doc.ents:
        entities.setdefault(ent.label_, []).append(ent.text)

    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # 1. Merchant Extraction
    # Prefer a real ORG entity, but only if it doesn't look like it was pulled
    # from a junk line (address/phone/etc). Otherwise fall back to the first
    # clean header line of the receipt (store name is almost always at the top).
    merchant = None
    for org in entities.get('ORG', []):
        if not NON_MERCHANT_LINE_RE.search(org):
            merchant = org
            break

    if not merchant:
        for line in lines[:6]:  # store name is near the top, not buried in the receipt
            if NON_MERCHANT_LINE_RE.search(line):
                continue
            amt, _ = _find_amount_in_line(line)
            is_date_like = bool(DATE_LINE_HINT_RE.search(line))
            if len(line) > 2 and amt is None and not is_date_like:
                merchant = line
                break

    # 2. Amount and Currency Extraction
    # Search line-by-line, prioritizing lines that mention a total keyword.
    # This avoids grabbing the first stray number (phone/date/qty) in the receipt.
    amount = None
    currency = None
    for keyword in TOTAL_KEYWORDS:
        pattern = re.compile(keyword, re.I)
        for line in lines:
            if pattern.search(line):
                amt, cur = _find_amount_in_line(line)
                if amt is not None:
                    amount = amt
                    currency = cur
                    break
        if amount is not None:
            break

    # Fallback: no "total"-style keyword found anywhere (poor OCR / unusual
    # layout) - use the largest plausible amount on the receipt, since the
    # grand total is virtually always the biggest number printed.
    if amount is None:
        candidates = []
        for line in lines:
            if NON_MERCHANT_LINE_RE.search(line) and not re.search(r'total|amount', line, re.I):
                continue
            amt, cur = _find_amount_in_line(line)
            if amt is not None:
                candidates.append((amt, cur))
        if candidates:
            amount, currency = max(candidates, key=lambda c: c[0])

    # 3. Date Extraction
    # Only attempt fuzzy parsing on lines that actually look date-shaped,
    # instead of the whole receipt blob (which causes false positives from
    # prices/phone numbers/item codes).
    date = None
    for line in lines:
        if DATE_LINE_HINT_RE.search(line):
            try:
                # dayfirst=True: Indian receipts use DD/MM/YYYY, but dateutil
                # defaults to MM/DD/YYYY when the date is ambiguous (e.g. both
                # numbers are <=12) - without this, "12-08-2026" (12 Aug) gets
                # silently misread as December 8th.
                candidate = dateparser.parse(line, fuzzy=True, default=None, dayfirst=True)
            except Exception:
                candidate = None
            if candidate:
                date = candidate
                break

    return {
        'merchant': merchant,
        'amount': amount,
        'currency': currency,
        'date': date.isoformat() if date else None,
        'raw_entities': entities
    }