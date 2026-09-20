# Casa Ferreiro — ementa e reservas

The P02 persona's build: **Django 5 templates styled with the `@wizeworks/silicaui`
Tailwind plugin and nothing else.** No React, no bundler, no JavaScript on the page.

## Run it

```
python -m venv .venv
./.venv/Scripts/python.exe -m pip install "Django>=5,<6" PyYAML whitenoise waitress
npm install
npm run css
./.venv/Scripts/python.exe manage.py runserver 8020
```

`npm run css` is the whole front-end build — the Tailwind CLI, once:

```
tailwindcss -i static/src/input.css -o static/css/site.css
```

## What it is for

| | |
| --- | --- |
| The menu | 4 courses, 19 dishes, prices aligned, accents in every position including the `<title>` |
| The booking form | a real Django form; the error state is server-rendered and painted by `[data-invalid]`, with no JavaScript |
| The wine list | `<details class="details">` — opens on a real Enter key, zero JS |
| The themes | `marble` and `carbon`, **declared** in `static/src/input.css`; `carbon` follows the OS through `prefersdark` |

Sofia edits `menu/ementa.yaml`. A dish with no `preco` renders as **"preço por definir"**,
never as `0,00 €`.

## Left to do before this ships

`package.json` points `@wizeworks/silicaui` at **`file:../../../../packages/silicaui`** — a
real symlink, so it is live and cannot go stale, but it is not what a customer installs. It
is there because issue **031** (a CSS-declared theme losing its type faces) is fixed in the
workspace and not yet in a published version.

**Re-pin to the published `@wizeworks/silicaui` once the changeset ships**, then rebuild the
CSS and check that `--font-head` still resolves to `Cormorant Garamond, serif` rather than
bare `serif`.
