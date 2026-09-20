"""O formulário de reserva.

Validação no servidor. O `required` do browser ajuda, mas não é a defesa —
a Sofia recebe reservas de telemóveis que eu nunca vi.
"""

import re
from datetime import date

from django import forms

DIA_DE_FECHO = 0  # segunda-feira

SITTINGS = [
    ("almoco", "Almoço — 12:00 às 15:00"),
    ("jantar", "Jantar — 19:00 às 22:30"),
]

# +351 22 605 4417, +351226054417, 226054417 — tudo isto é a mesma coisa.
TELEFONE = re.compile(r"^(?:\+351\s?)?(?:\d[\s-]?){9}$")


class ReservaForm(forms.Form):
    nome = forms.CharField(
        label="Nome",
        max_length=80,
        error_messages={
            "required": "Diga-nos o nome para a reserva.",
            "max_length": "O nome não pode ter mais de 80 caracteres.",
        },
    )
    telefone = forms.CharField(
        label="Telefone",
        max_length=20,
        error_messages={"required": "Precisamos de um telefone para confirmar."},
    )
    dia = forms.DateField(
        label="Dia",
        widget=forms.DateInput(attrs={"type": "date"}),
        error_messages={
            "required": "Escolha o dia.",
            "invalid": "Não percebemos essa data. Use o calendário do campo.",
        },
    )
    servico = forms.ChoiceField(label="Serviço", choices=SITTINGS)
    pessoas = forms.IntegerField(
        label="Pessoas",
        min_value=1,
        max_value=12,
        error_messages={
            "required": "Quantas pessoas são?",
            "min_value": "Tem de ser pelo menos uma pessoa.",
            "max_value": "Para mais de 12 pessoas telefone-nos: +351 22 605 4417. "
            "A sala tem 28 lugares e um grupo grande precisa de ser combinado.",
        },
    )

    def clean_telefone(self):
        valor = (self.cleaned_data["telefone"] or "").strip()
        if not TELEFONE.match(valor):
            raise forms.ValidationError(
                "Escreva o telefone com 9 dígitos, por exemplo 226054417 "
                "ou +351 22 605 4417."
            )
        return valor

    def clean_dia(self):
        dia = self.cleaned_data["dia"]
        if dia < date.today():
            raise forms.ValidationError("Esse dia já passou. Escolha um dia a partir de hoje.")
        if dia.weekday() == DIA_DE_FECHO:
            raise forms.ValidationError(
                "À segunda-feira estamos fechados. Escolha de terça a domingo."
            )
        return dia
