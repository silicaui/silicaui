import { Breadcrumb } from "silicaui-react";
import { Section } from "../lib/Section";

export function BreadcrumbDemo() {
    return (
        <Section title="Real use · navigation trail">
            <Breadcrumb>
                <li>
                    <a href="#">Home</a>
                </li>
                <li>
                    <a href="#">Projects</a>
                </li>
                <li>
                    <a href="#">Silica UI</a>
                </li>
                <li>
                    <span aria-current="page">Breadcrumb</span>
                </li>
            </Breadcrumb>
        </Section>
    );
}
