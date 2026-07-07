import { NativeSelect } from "silicaui-react";
import { Section, Row, Stack } from "../lib/Section";
import { SIZES } from "../lib/data";

export function SelectDemo() {
    return (
        <>
            <Section title="Colors">
                <Stack className="max-w-md">
                    <NativeSelect defaultValue="">
                        <option value="" disabled>
                            Pick a framework…
                        </option>
                        <option>React</option>
                        <option>Svelte</option>
                        <option>Vue</option>
                        <option>Solid</option>
                    </NativeSelect>
                    <NativeSelect color="primary" defaultValue="React">
                        <option>React</option>
                        <option>Svelte</option>
                        <option>Vue</option>
                    </NativeSelect>
                    <NativeSelect color="success" defaultValue="React">
                        <option>React</option>
                        <option>Svelte</option>
                    </NativeSelect>
                    <NativeSelect color="error" defaultValue="React">
                        <option>React</option>
                        <option>Svelte</option>
                    </NativeSelect>
                    <NativeSelect disabled defaultValue="React">
                        <option>React</option>
                    </NativeSelect>
                </Stack>
            </Section>

            <Section title="Sizes">
                <Row>
                    {SIZES.map((size) => (
                        <NativeSelect key={size} size={size} defaultValue={size}>
                            <option>{size}</option>
                        </NativeSelect>
                    ))}
                </Row>
            </Section>

            <Section title="Real use · shipping region">
                <div className="grid max-w-sm gap-3 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
                    <label className="flex flex-col gap-1.5 text-sm">
                        Country
                        <NativeSelect color="primary" defaultValue="US">
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="MX">Mexico</option>
                            <option value="UK">United Kingdom</option>
                        </NativeSelect>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                        Shipping speed
                        <NativeSelect defaultValue="standard">
                            <option value="standard">Standard (5–7 days)</option>
                            <option value="express">Express (2–3 days)</option>
                            <option value="overnight">Overnight</option>
                        </NativeSelect>
                    </label>
                </div>
            </Section>
        </>
    );
}
