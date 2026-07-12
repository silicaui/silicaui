---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
---

Toast now supports a clickable action button. `useToast().add()` accepts `actionProps` (forwarded to Base UI's `Toast.Action`, rendered as a `<button>`) — commonly paired with `timeout: 0` so the toast doesn't auto-dismiss before the user can act: `toast.add({ title: "New version available", actionProps: { children: "Refresh", onClick: () => location.reload() }, timeout: 0 })`. Adds a `.toast-action` style (an outlined pill reading `currentColor`/`--toast-fg`, so it stays legible across every `data-type` and in dark mode) positioned between the toast content and the close button.
