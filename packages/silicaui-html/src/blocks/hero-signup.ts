/**
 * Hero — Email Capture. The conversion opener: no navigation, no second path,
 * just a claim and one field. Reach for it on a launch or waitlist page, where
 * the only action worth measuring is the address.
 *
 * The form is a `Form` atom, which self-applies the `form` behavior marker
 * (silicaui-html/src/component.ts), so a published page validates and submits
 * with zero author wiring; `action: "subscribe"` names the host action a valid
 * submit dispatches to. Same idiom as contact-section.ts, minus the `Field`
 * wrappers — a single labelled-by-placeholder row does not need them.
 *
 * ONE DELIBERATE BREAK FROM THE FAMILY: everywhere else `cta` is a `link` slot,
 * because a hero CTA navigates. Here it submits, so the slot is a `text` one —
 * it is a button label, not a destination, and typing it as a link would invite
 * a host to fill it with an href that the form would then ignore.
 */
import { atom, block, el, slot } from "../kit";
import { headline, subhead, trustRow } from "./hero-kit";

export const heroSignup = block({
    key: "hero_signup",
    name: "Hero — Email Capture",
    category: "hero",
    version: "1.0.0",
    description: "Centered claim over an inline email form — the waitlist and launch opener.",
    tags: ["hero", "marketing", "form", "lead"],
    colors: ["base-100", "base-content", "primary"],
    behaviors: ["form"],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center @3xl:py-28", {
                children: [
                    headline("display-2", "Get it before everyone else does"),
                    subhead("lead max-w-xl", "We're opening access in small groups. Leave your address and we'll come find you when it's your turn."),
                    atom("Form", "flex w-full max-w-md flex-col gap-3 @sm:flex-row", { action: "subscribe" }, [
                        atom("Input", "input flex-1", {
                            type: "email",
                            name: "email",
                            placeholder: "you@example.com",
                            required: true,
                        }),
                        slot(atom("Button", "btn btn-primary", { label: "Get early access", type: "submit" }), {
                            name: "cta",
                            type: "text",
                            label: "Button label",
                        }),
                    ]),
                    slot(
                        el("p", "text-sm text-base-content", {
                            text: "No credit card. One email when it's ready, and an unsubscribe link in every one after.",
                        }),
                        { name: "note", type: "text", label: "Reassurance line" },
                    ),
                    trustRow("mt-2 flex items-center gap-3", "Join 12,000+ people already on the list"),
                ],
            }),
        ],
    }),
});
