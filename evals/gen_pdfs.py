#!/usr/bin/env python3
"""Render the synthetic resume fixtures to simple PDFs (reportlab), for the
unpdf text-extraction fidelity eval. Deterministic layout, one page where possible."""
import json, os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")
OUT = os.path.join(BASE, "pdf")
os.makedirs(OUT, exist_ok=True)

manifest = json.load(open(os.path.join(BASE, "manifest.json")))
made = []
for entry in manifest["resumes"]:
    src = os.path.join(BASE, entry["file"])
    name = os.path.splitext(os.path.basename(entry["file"]))[0] + ".pdf"
    dst = os.path.join(OUT, name)
    c = canvas.Canvas(dst, pagesize=A4)
    c.setFont("Helvetica", 10)
    width, height = A4
    y = height - 50
    with open(src, encoding="utf-8") as f:
        for line in f.read().splitlines():
            if y < 50:
                c.showPage()
                c.setFont("Helvetica", 10)
                y = height - 50
            # wrap long lines crudely at 95 chars
            text = line
            while len(text) > 95:
                c.drawString(50, y, text[:95])
                y -= 14
                text = text[95:]
                if y < 50:
                    c.showPage()
                    c.setFont("Helvetica", 10)
                    y = height - 50
            c.drawString(50, y, text)
            y -= 14
    c.save()
    made.append(name)
print(f"pdfs: {len(made)}")
