/**
 * Footer — Newsletter. The subscribe form leads, two link columns follow. Reach
 * for it when the list IS the funnel — a publication, a changelog-driven product,
 * anything where the footer is the second-best place to capture an address after
 * the hero.
 *
 * The form is a `Form` atom, which self-applies the `form` behavior marker
 * (silicaui-html/src/component.ts), so a published page validates and submits
 * with zero author wiring; `action: "subscribe"` names the host action a valid
 * submit dispatches to. Same idiom as hero-signup.ts and contact-section.ts.
 *
 * ONE DELIBERATE BREAK FROM THE FAMILY: `cta` is a `text` slot, not a `link`.
 * The button submits rather than navigates, so it is a button LABEL — typing it
 * as a link would invite a host to fill it with an href the form then ignores.
 * hero-signup.ts makes the same call for the same reason.
 */
import { atom, block, el, slot } from "../kit";
import { SOCIAL, blurb, brandMark, legalBar, linkColumn, socialRow } from "./footer-kit";

export const footerNewsletter = block({
    key: "footer_newsletter",
    name: "Footer — Newsletter",
    category: "footer",
    version: "1.0.0",
    description: "A working subscribe form leading two link columns, over a legal bar.",
    tags: ["footer", "form", "lead", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["form"],
    emailEligible: false,
    root: el("footer", "@container bg-base-200 border-t border-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-14", {
                children: [
                    el("div", "grid grid-cols-1 gap-10 @3xl:grid-cols-2", {
                        children: [
                            el("div", "flex flex-col gap-4", {
                                children: [
                                    brandMark("wordmark self-start"),
                                    blurb(
                                        "max-w-sm text-sm text-base-content",
                                        "One email a month: what shipped, what broke, and what we learned fixing it.",
                                    ),
                                    atom("Form", "flex w-full max-w-md flex-col gap-3 @sm:flex-row", { action: "subscribe" }, [
                                        atom("Input", "input flex-1", {
                                            type: "email",
                                            name: "email",
                                            placeholder: "you@example.com",
                                            required: true,
                                        }),
                                        slot(atom("Button", "btn btn-primary", { label: "Subscribe", type: "submit" }), {
                                            name: "cta",
                                            type: "text",
                                            label: "Button label",
                                        }),
                                    ]),
                                    slot(
                                        el("p", "text-sm text-base-content", {
                                            text: "No spam, and an unsubscribe link in every issue.",
                                        }),
                                        { name: "note", type: "text", label: "Reassurance line" },
                                    ),
                                ],
                            }),
                            el("div", "grid grid-cols-1 gap-8 @sm:grid-cols-2", {
                                children: [
                                    linkColumn("Product", "col1", [
                                        ["Features", "link1"],
                                        ["Pricing", "link2"],
                                        ["Changelog", "link3"],
                                        ["Roadmap", "link4"],
                                    ]),
                                    linkColumn("Company", "col2", [
                                        ["About", "link5"],
                                        ["Careers", "link6"],
                                        ["Press", "link7"],
                                        ["Contact", "link8"],
                                    ]),
                                ],
                            }),
                        ],
                    }),
                    legalBar(
                        "mt-12 flex flex-col gap-4 border-t border-base-200 pt-6 @2xl:flex-row @2xl:items-center @2xl:justify-between",
                        [socialRow("flex items-center gap-5", SOCIAL)],
                    ),
                ],
            }),
        ],
    }),
});
