import openpyxl, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
wb = openpyxl.load_workbook(r"C:\Users\rizky\Downloads\Copy of Wedding Planner for Reina.xlsx", data_only=True)
for sh, mrow in [('List Seserahan',15),('Engagement Budget',6),('Administrasi & Dokumen',6)]:
    ws = wb[sh]
    print("\n####",sh)
    for r in range(1,mrow+1):
        cells=[]
        for col in range(1,10):
            cell=ws.cell(row=r,column=col)
            if cell.value is not None:
                cells.append(f"{cell.coordinate}={str(cell.value)[:40]!r}")
        if cells: print(" | ".join(cells))
