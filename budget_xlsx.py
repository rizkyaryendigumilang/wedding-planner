import openpyxl, sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
path = r"C:\Users\rizky\Downloads\Copy of Wedding Planner for Reina.xlsx"
wb = openpyxl.load_workbook(path, data_only=True)

# Full engagement budget rows with payment termin detail
for sh in ['Engagement Budget','Wedding Budget']:
    ws = wb[sh]
    print("\n#### ", sh)
    for i, r in enumerate(ws.iter_rows(min_row=1, max_row=60, values_only=True), 1):
        vals = ["" if c is None else str(c).strip() for c in r]
        while vals and vals[-1]=="": vals.pop()
        joined = " | ".join(vals)
        if joined: print(i, "->", joined)
