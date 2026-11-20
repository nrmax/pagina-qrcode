#!/usr/bin/env python3
"""Ferramenta de leitura precisa de PDFs (manuais, normas, desenhos, catálogos).

Comandos:
  info    <pdf>                         -> nº de páginas, tamanho, páginas sem texto (escaneadas/desenho)
  search  <pdf> "termo" [...]           -> páginas onde o termo aparece (com trecho)
  text    <pdf> <pag_ini> [pag_fim]     -> texto das páginas (OCR automático se a página for imagem)
  tables  <pdf> <pagina>                -> tabelas detectadas na página (colunas separadas por |)
  render  <pdf> <pagina> [--dpi 150] [--crop x0 y0 x1 y1] [--out arq.png]
                                        -> imagem da página (ou recorte, em frações 0-1 da página)
  index   <pasta>                       -> gera indice.md com os PDFs da pasta
Páginas começam em 1.
"""
import sys, os, subprocess, argparse, tempfile, glob

try:
    import pdfplumber
except ImportError:
    sys.exit("Falta pdfplumber: pip install pdfplumber --break-system-packages")


def page_text(page, pdf_path, pno):
    txt = (page.extract_text() or "").strip()
    if len(txt) >= 20:
        return txt, False
    # página sem texto -> provavelmente escaneada: tenta OCR
    with tempfile.TemporaryDirectory() as d:
        base = os.path.join(d, "p")
        subprocess.run(["pdftoppm", "-r", "300", "-f", str(pno), "-l", str(pno), "-png", pdf_path, base], check=True)
        png = glob.glob(base + "*.png")[0]
        r = subprocess.run(["tesseract", png, "-", "-l", "por+eng"], capture_output=True, text=True)
        if r.returncode != 0:
            r = subprocess.run(["tesseract", png, "-"], capture_output=True, text=True)
        return r.stdout.strip(), True


def cmd_info(a):
    with pdfplumber.open(a.pdf) as pdf:
        n = len(pdf.pages)
        print(f"Arquivo: {os.path.basename(a.pdf)}\nPáginas: {n}")
        w, h = pdf.pages[0].width, pdf.pages[0].height
        print(f"Tamanho pág. 1: {w:.0f} x {h:.0f} pt (~{w/72*25.4:.0f} x {h/72*25.4:.0f} mm)")
        sem_texto = [i for i, p in enumerate(pdf.pages, 1) if len((p.extract_text() or "").strip()) < 20]
        print("Páginas sem texto (imagem/escaneada/desenho): " + (", ".join(map(str, sem_texto)) or "nenhuma"))
        for i in range(min(n, 3)):
            t = (pdf.pages[i].extract_text() or "").strip().splitlines()
            print(f"--- início da pág. {i+1}: " + " / ".join(t[:4])[:200])


def cmd_search(a):
    termos = [t.lower() for t in a.termos]
    achou = False
    with pdfplumber.open(a.pdf) as pdf:
        for i, p in enumerate(pdf.pages, 1):
            t = p.extract_text() or ""
            tl = t.lower()
            for termo in termos:
                pos = tl.find(termo)
                if pos >= 0:
                    achou = True
                    trecho = t[max(0, pos - 60): pos + 100].replace("\n", " ")
                    print(f"pág. {i} [{termo}]: ...{trecho}...")
    if not achou:
        print("Nenhuma ocorrência no texto. Se o PDF for escaneado, use 'text' (faz OCR) ou 'info' para ver páginas sem texto.")


def cmd_text(a):
    fim = a.fim or a.ini
    with pdfplumber.open(a.pdf) as pdf:
        for pno in range(a.ini, fim + 1):
            t, ocr = page_text(pdf.pages[pno - 1], a.pdf, pno)
            print(f"\n===== PÁGINA {pno}" + (" (OCR - conferir números na imagem)" if ocr else "") + " =====")
            print(t)


def cmd_tables(a):
    with pdfplumber.open(a.pdf) as pdf:
        tabs = pdf.pages[a.pagina - 1].extract_tables()
    if not tabs:
        print("Nenhuma tabela detectada automaticamente. Renderize a página e leia visualmente.")
    for k, tb in enumerate(tabs, 1):
        print(f"\n--- Tabela {k} (pág. {a.pagina}) ---")
        for row in tb:
            print(" | ".join((c or "").replace("\n", " ") for c in row))


def cmd_render(a):
    out = a.out or f"/home/claude/pag_{a.pagina}.png"
    with tempfile.TemporaryDirectory() as d:
        base = os.path.join(d, "p")
        subprocess.run(["pdftoppm", "-r", str(a.dpi), "-f", str(a.pagina), "-l", str(a.pagina), "-png", a.pdf, base], check=True)
        png = glob.glob(base + "*.png")[0]
        if a.crop:
            from PIL import Image
            im = Image.open(png)
            W, H = im.size
            x0, y0, x1, y1 = a.crop
            im.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))).save(out)
        else:
            os.replace(png, out)
    print(out)


def cmd_index(a):
    linhas = ["# Índice da biblioteca de PDFs", "",
              "| Arquivo | Páginas | Tipo | Início da 1ª página |", "|---|---|---|---|"]
    for f in sorted(glob.glob(os.path.join(a.pasta, "**", "*.pdf"), recursive=True)):
        with pdfplumber.open(f) as pdf:
            n = len(pdf.pages)
            t = " ".join((pdf.pages[0].extract_text() or "").split())[:140]
        linhas.append(f"| {os.path.relpath(f, a.pasta)} | {n} | (preencher: manual/norma/desenho/catálogo) | {t} |")
    dest = os.path.join(a.pasta, "indice.md")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write("\n".join(linhas) + "\n")
    print("Gerado", dest)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("info"); p.add_argument("pdf"); p.set_defaults(f=cmd_info)
    p = sp.add_parser("search"); p.add_argument("pdf"); p.add_argument("termos", nargs="+"); p.set_defaults(f=cmd_search)
    p = sp.add_parser("text"); p.add_argument("pdf"); p.add_argument("ini", type=int); p.add_argument("fim", type=int, nargs="?"); p.set_defaults(f=cmd_text)
    p = sp.add_parser("tables"); p.add_argument("pdf"); p.add_argument("pagina", type=int); p.set_defaults(f=cmd_tables)
    p = sp.add_parser("render"); p.add_argument("pdf"); p.add_argument("pagina", type=int)
    p.add_argument("--dpi", type=int, default=150); p.add_argument("--crop", type=float, nargs=4); p.add_argument("--out"); p.set_defaults(f=cmd_render)
    p = sp.add_parser("index"); p.add_argument("pasta"); p.set_defaults(f=cmd_index)
    a = ap.parse_args(); a.f(a)
