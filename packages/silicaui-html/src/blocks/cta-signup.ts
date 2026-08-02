/**
 * CTA — Email Capture. One field instead of one button, for the reader who is
 * interested but not ready. Reach for it at the end of a blog post, a changelog,
 * or a docs page — anywhere the honest next step is "tell me when", not "buy".
 *
 * The form is a `Form` atom, which self-applies the `form` behavior marker
 * (silicaui-html/src/component.ts), so a published page validates and submits
 * with zero author wiring; `action: "subscribe"` names the host action a valid
 * submit dispatches to. Same idiom as hero-signup.ts and footer-newsletter.ts.
 *
 * ONE DELIBERATE BREAK FROM THE FAMILY: everywhere else `primary` is a `link`
 * slot, because a CTA navigates. Here it submits, so the slot is a `text` one —
 * it is a button label, not a destination, and typing it as a link would invite
 * a host to fill it with an href that the form would then ignore.
 */
import { atom, block, el, slot } from "../kit";
import { headline, note, subhead } from "./cta-kit";

export const ctaSignup = block({
    key: "cta_signup",
    name: "CTA — Email Capture",
    category: "cta",
    version: "1.0.0",
    description: "A centered ask with a working inline email form instead of a button.",
    tags: ["cta", "form", "lead", "conversion"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["form"],
    emailEligible: false,
    root: el("section", "@container bg-base-100 border-y border-base-200", {
        children: [
            el("div", "mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-14 text-center", {
                children: [
                    headline("text-2xl font-semibold text-base-content @2xl:text-3xl", "Get the next one in your inbox"),
                    subhead("max-w-lg text-base-content", "Short notes on what we shipped and what it cost us. Roughly monthly."),
                    atom("Form", "flex w-full max-w-md flex-col gap-3 @sm:flex-row", { action: "subscribe" }, [
                        atom("Input", "input flex-1", {
                            type: "email",
                            name: "email",
                            placeholder: "you@example.com",
                            required: true,
                        }),
                        slot(atom("Button", "btn btn-primary", { label: "Subscribe", type: "submit" }), {
                            name: "primary",
                            type: "text",
                            label: "Button label",
                        }),
                    ]),
                    note("text-sm text-base-content", "One click to unsubscribe, in every email."),
                ],
            }),
        ],
    }),
});
