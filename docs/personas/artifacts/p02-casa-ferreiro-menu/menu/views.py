"""Casa Ferreiro — a ementa e as reservas.

Sem JavaScript de construção. O CSS vem do Tailwind CLI com o plugin silicaui;
este ficheiro só serve HTML.
"""

from datetime import date
from pathlib import Path

import yaml
from django.shortcuts import render

from .forms import SITTINGS, ReservaForm

EMENTA = Path(__file__).resolve().parent / "ementa.yaml"

# Terça a domingo. Segunda-feira fechado. date.weekday(): segunda = 0.
DIA_DE_FECHO = 0


def carregar_ementa():
    """Lê o ficheiro que a Sofia edita.

    Um prato sem preço fica com `preco = None` — e o template TEM de o dizer.
    Um preço em falta que apareça como "0,00 €" seria uma mentira, não um vazio.
    """
    with EMENTA.open(encoding="utf-8") as fh:
        cursos = yaml.safe_load(fh) or []
    for curso in cursos:
        curso["slug"] = curso["curso"].lower().replace(" ", "-")
        for prato in curso.get("pratos", []):
            prato.setdefault("descricao", "")
            preco = prato.get("preco")
            prato["preco"] = str(preco) if preco not in (None, "") else None
    return cursos


def _contexto(form, confirmada=None):
    cursos = carregar_ementa()
    hoje = date.today()
    return {
        "cursos": cursos,
        "total_pratos": sum(len(c["pratos"]) for c in cursos),
        "aberto_hoje": hoje.weekday() != DIA_DE_FECHO,
        "hoje": hoje,
        "form": form,
        "reserva_confirmada": confirmada,
    }


def ementa(request):
    return render(request, "menu/ementa.html", _contexto(ReservaForm()))


def reservar(request):
    if request.method != "POST":
        return render(request, "menu/ementa.html", _contexto(ReservaForm()))

    form = ReservaForm(request.POST)
    if not form.is_valid():
        # O mesmo template, com os erros. Nada de redirect — ele perderia o que escreveu.
        return render(request, "menu/ementa.html", _contexto(form), status=422)

    dados = form.cleaned_data
    confirmada = {
        "nome": dados["nome"],
        "telefone": dados["telefone"],
        "dia": dados["dia"],
        "pessoas": dados["pessoas"],
        "servico_label": dict(SITTINGS)[dados["servico"]],
    }
    return render(request, "menu/ementa.html", _contexto(ReservaForm(), confirmada))
