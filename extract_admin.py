import openpyxl, sys, io, json, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
OUT = r"C:\Users\rizky\Documents\Dev\wedding-planner\seed"
wb = openpyxl.load_workbook(r"C:\Users\rizky\Downloads\Copy of Wedding Planner for Reina.xlsx", data_only=True)
def c(v): return "" if v is None else str(v).strip()

ws=wb['Administrasi & Dokumen']; out=[]; section="LAIN-LAIN"
for r in range(6, 120):
    A,B,C,D,E,F = (c(ws.cell(r,col).value) for col in range(1,7))
    if A and B and not C and len(A)<=2:       # "A" | "Persiapan Awal"
        section=f"{A}. {B}"; continue
    if B and not A and C in ("CPP","CPW"):     # section B header row
        section="B. Administrasi Persiapan Pernikahan"; continue
    if not B or B.lower() in ("daftar persiapan","progress","details"): continue
    # docs rows: CPP in col C, CPW in col D
    is_doc = C in ("True","False","-") or D in ("True","False","-")
    out.append({"section":section,"item":B,
                "progress": "" if is_doc else C,
                "cpp_complete": C.lower()=="true","cpw_complete": D.lower()=="true",
                "is_document": is_doc,"details":F})
json.dump(out, open(os.path.join(OUT,"administrations.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=2)
print("admin:", len(out))
for x in out: print(" ", x['section'],"|",x['item'],"|doc" if x['is_document'] else f"|prog:{x['progress']}", "|", x['cpp_complete'], x['cpw_complete'])
