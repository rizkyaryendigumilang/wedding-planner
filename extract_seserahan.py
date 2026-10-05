import openpyxl, sys, io, json, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
path = r"C:\Users\rizky\Downloads\Copy of Wedding Planner for Reina.xlsx"
wb = openpyxl.load_workbook(path, data_only=True)

def clean(v):
    if v is None: return ""
    s = str(v).strip()
    return s

# ---------- SESERAHAN ----------
ws = wb['List Seserahan']
seserahan = []
section = None
for r in ws.iter_rows(min_row=3, max_row=200, values_only=True):
    vals = [clean(c) for c in r]
    no, detail, brand, qty, link, budget, checklist, actual = (vals + [""]*8)[:8]
    if detail and not no and not brand and not link:
        section = detail  # section heading like ALAT SHOLAT
        continue
    if not detail:
        continue
    if str(detail).lower().startswith('total'):
        continue
    def num(x):
        try: return float(x)
        except: return 0
    seserahan.append({
        "category": section or "LAIN-LAIN",
        "detail": detail,
        "brand": brand,
        "qty": int(num(qty)) if qty else 1,
        "link": link,
        "budget": num(budget),
        "checklist": str(checklist).lower() == 'true' if checklist else False,
        "actually_harga": num(actual),
    })
print("SESERAHAN COUNT:", len(seserahan))
print(json.dumps(seserahan, ensure_ascii=False, indent=1))
