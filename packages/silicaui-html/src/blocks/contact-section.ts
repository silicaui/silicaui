/**
 * Contact — split section. Copy + contact details on the left, a working form on
 * the right. The form is a `Form` atom (so it ships the form-contract markers and
 * validates + submits once a host hydrates it) with `action: "contact"` naming
 * the host action a valid submit dispatches to. Container-query responsive: the
 * two columns collapse to one on a narrow container.
 */
import { atom, block, el, slot } from "../kit";

export const contactSection = block({
    key: "contact_section",
    name: "Contact — form + details",
    category: "contact",
    version: "1.0.0",
    description: "A split contact section: copy and details beside a working, validating form.",
    tags: ["contact", "form", "lead"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["form"],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 px-6 py-16 @2xl:grid-cols-2", {
                children: [
                    el("div", "flex flex-col gap-4", {
                        children: [
                            slot(el("h2", "text-3xl font-semibold text-base-content", { text: "Get in touch" }), {
                                name: "heading",
                                type: "text",
                                label: "Heading",
                            }),
                            slot(
                                el("p", "text-base-content/70", {
                                    text: "Tell us what you're building and we'll get back to you within one business day.",
                                }),
                                { name: "subhead", type: "text", label: "Subheadline" },
                            ),
                            el("div", "mt-2 flex flex-col gap-2 text-sm text-base-content/70", {
                                children: [
                                    el("p", undefined, { text: "hello@silicaui.com" }),
                                    el("p", undefined, { text: "+1 (555) 012-3456" }),
                                ],
                            }),
                        ],
                    }),
                    atom("Form", "flex flex-col gap-4", { action: "contact" }, [
                        atom("Field", "field", undefined, [
                            el("label", "field-label", { text: "Name" }),
                            atom("Input", "input", { type: "text", name: "name", placeholder: "Your name", required: true }),
                        ]),
                        atom("Field", "field", undefined, [
                            el("label", "field-label", { text: "Email" }),
                            atom("Input", "input", { type: "email", name: "email", placeholder: "you@example.com", required: true }),
                        ]),
                        atom("Field", "field", undefined, [
                            el("label", "field-label", { text: "Message" }),
                            atom("Textarea", "textarea", { name: "message", placeholder: "How can we help?", rows: 4 }),
                        ]),
                        atom("Button", "btn btn-primary", { label: "Send message", type: "submit" }),
                    ]),
                ],
            }),
        ],
    }),
});
