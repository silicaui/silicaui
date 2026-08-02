/**
 * Footer — Sitemap. The wide one: a brand column plus four columns of links, a
 * real office and contact line under them, and a legal bar carrying a service
 * status pill. Reach for it on a site with enough surface that the footer is
 * genuinely how people navigate — docs, solutions, changelog, careers.
 *
 * The status pill is the one `badge` in the family and it is legitimate under
 * house RULE #2: a badge marks STATE ON A THING (here, whether the service is
 * up), which is the opposite of the decorative label-above-a-heading the rule
 * bans. It is also the only place `success` appears in the footer family.
 *
 * `<address>` for the office line, with `not-italic` — the tag is the correct
 * semantics for contact details of the page's owner, and every browser italicises
 * it by default, which is not what a footer wants.
 *
 * Four link columns, not five: the brand column spans two of six tracks past
 * `@3xl` so the blurb sets on two lines. A fifth column would either squeeze the
 * brand back to one track or push the grid to seven and break the rhythm.
 */
import { block, el, slot } from "../kit";
import { SOCIAL, blurb, brandMark, legalBar, linkColumn, linkRow, socialRow } from "./footer-kit";

export const footerSitemap = block({
    key: "footer_sitemap",
    name: "Footer — Sitemap",
    category: "footer",
    version: "1.0.0",
    description: "A wide brand column and four link columns over contact details and a status pill.",
    tags: ["footer", "nav", "sitemap", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary", "success"],
    behaviors: [],
    emailEligible: false,
    root: el("footer", "@container bg-base-100 border-t border-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-7xl px-6 py-16", {
                children: [
                    el("div", "grid grid-cols-2 gap-x-8 gap-y-10 @md:grid-cols-3 @3xl:grid-cols-6", {
                        children: [
                            el("div", "col-span-2 flex flex-col gap-4", {
                                children: [
                                    brandMark("wordmark self-start"),
                                    blurb(
                                        "max-w-xs text-sm text-base-content",
                                        "Commerce infrastructure for teams that would rather build the store than the stack.",
                                    ),
                                    socialRow("mt-2 flex items-center gap-5", SOCIAL),
                                ],
                            }),
                            linkColumn("Product", "col1", [
                                ["Overview", "link1"],
                                ["Storefront", "link2"],
                                ["Checkout", "link3"],
                                ["Analytics", "link4"],
                                ["Pricing", "link5"],
                            ]),
                            linkColumn("Solutions", "col2", [
                                ["Retail", "link6"],
                                ["Marketplaces", "link7"],
                                ["Subscriptions", "link8"],
                                ["Enterprise", "link9"],
                            ]),
                            linkColumn("Developers", "col3", [
                                ["Documentation", "link10"],
                                ["API reference", "link11"],
                                ["Changelog", "link12"],
                                ["Status", "link13"],
                            ]),
                            linkColumn("Company", "col4", [
                                ["About", "link14"],
                                ["Careers", "link15"],
                                ["Press", "link16"],
                                ["Contact", "link17"],
                            ]),
                        ],
                    }),
                    el("div", "mt-12 flex flex-col gap-2 border-t border-base-200 pt-8 @2xl:flex-row @2xl:items-center @2xl:justify-between", {
                        children: [
                            slot(
                                el("address", "text-sm not-italic text-base-content", {
                                    text: "1180 Mission Street, Suite 400, San Francisco, CA 94103",
                                }),
                                { name: "address", type: "text", label: "Office address" },
                            ),
                            linkRow("flex flex-wrap items-center gap-x-6 gap-y-2", [
                                ["sales@silicaui.com", "link18"],
                                ["support@silicaui.com", "link19"],
                            ]),
                        ],
                    }),
                    legalBar(
                        "mt-8 flex flex-col gap-4 border-t border-base-200 pt-6 @2xl:flex-row @2xl:items-center @2xl:justify-between",
                        [
                            el("div", "flex flex-wrap items-center gap-x-6 gap-y-2", {
                                children: [
                                    slot(
                                        el("span", "badge badge-success badge-sm", { text: "All systems operational" }),
                                        { name: "status", type: "text", label: "Status pill" },
                                    ),
                                    linkRow("flex flex-wrap items-center gap-x-6 gap-y-2", [
                                        ["Privacy", "link20"],
                                        ["Terms", "link21"],
                                        ["Cookies", "link22"],
                                    ]),
                                ],
                            }),
                        ],
                    ),
                ],
            }),
        ],
    }),
});
