import re

def normalize_card(card: str) -> str:
    return re.sub(r"\s+", "", card or "")

def is_valid_card_16(card: str) -> bool:
    c = normalize_card(card)
    return bool(re.fullmatch(r"\d{16}", c))

def is_valid_cvv(cvv: str) -> bool:
    return bool(re.fullmatch(r"\d{3}", cvv or ""))

def is_valid_expiry(mm_yy: str) -> bool:
    # check MM/YY.
    return bool(re.fullmatch(r"(0[1-9]|1[0-2])\/\d{2}", mm_yy or ""))