import openpyxl, sys, io, json, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
OUT = r"C:\Users\rizky\Documents\Dev\wedding-planner\seed"
wb = openpyxl.load_workbook(r"C:\Users\rizky\Downloads\Copy of Wedding Planner for Reina.xlsx", data_only=True)
def c(v): return "" if v is None else str(v).strip()
def num(x):
    try: return float(x)
    except: return 0.0

ws=wb['Administrasi & Dokumen']; out=[]; section="LAIN-LAIN"
for r in range(6, 120):
    A,B,C,D,E,F = (c(ws.cell(r,col).value) for col in range(1,7))
    if A and B and not C and len(A)<=2: section=f"{A}. {B}"; continue
    if B=="Administrasi Persiapan Pernikahan": section=f"B. {B}"; continue
    if not B or B.lower() in ("daftar persiapan","progress","details"): continue
    is_doc = C in ("True","False","-") or D in ("True","False","-")
    out.append({"section":section,"item":B,"progress":"" if is_doc else C,
                "cpp_complete": C.lower()=="true","cpw_complete": D.lower()=="true",
                "is_document":is_doc,"details":F})
json.dump(out, open(os.path.join(OUT,"administrations.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=2)
print("admin:", len(out), "sections:", sorted({x['section'] for x in out}))

# ================= GUESTS =================
# Daftar Tamu Kevin  -> pihak CPW (female)
# Daftar Tamu Aurene -> pihak CPW? Actually Kevin sheet = bride side in workbook; we map explicitly.
# In workbook: 'Daftar Tamu Kevin' header says "UNDANGAN PIHAK CPW", 'Daftar Tamu Aurene' = CPW family (Papa/Mama).
# We'll tag side by sheet: Kevin sheet -> CPW, Aurene sheet -> CPP is ambiguous; use explicit mapping below.
SHEET_SIDE = {
    'Daftar Tamu Kevin': 'CPW',   # sheet labelled "UNDANGAN PIHAK CPW"
    'Daftar Tamu Aurene': 'CPP',
    'Daftar Tamu Kevin & Aurene': 'CPP',
}
guests=[]
for sheet, side in SHEET_SIDE.items():
    ws=wb[sheet]
    for r in range(3, 400):
        row=[c(ws.cell(r,col).value) for col in range(1,12)]
        no,name,rel,group,prio,pax,origin,checklist,inv,att,notes = (row+[""]*11)[:11]
        if name.lower().startswith("nama tamu"): continue
        if not name: continue
        guests.append({"side":side,"name":name,"relationship":rel or "-","group_name":group or "Umum",
                       "priority":prio or "A - Must Invite","pax":int(num(pax)) or 1,
                       "origin":origin or "-","checklist":checklist.lower()=="true",
                       "type":inv or "Digital","status":att or "Belum","notes":notes or "-"})
json.dump(guests, open(os.path.join(OUT,"guests.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=2)
print("guests:", len(guests))
from collections import Counter
print("  by side:", Counter(g['side'] for g in guests))
print("  by group:", Counter(g['group_name'] for g in guests).most_common())
print("  by type:", Counter(g['type'] for g in guests))
print("  by status:", Counter(g['status'] for g in guests))
print("  total pax:", sum(g['pax'] for g in guests))
