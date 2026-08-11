import {
    Tabs,
    TabsList,
    TabsTab,
    TabsPanel,
    Input,
    Button,
} from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";
import { COLORS } from "../lib/data";

export function TabsDemo() {
    return (
        <>
            <Section title="Colors">
                <Row>
                    {COLORS.slice(0, 6).map((color) => (
                        <Tabs key={color} color={color} defaultValue="a" className="w-40">
                            <TabsList>
                                <TabsTab value="a">One</TabsTab>
                                <TabsTab value="b">Two</TabsTab>
                            </TabsList>
                        </Tabs>
                    ))}
                </Row>
            </Section>

            <Section title="More tabs than fit — the strip says so on its own">
                <div className="flex flex-col gap-4">
                    {(["underline", "boxed", "pills"] as const).map((variant) => (
                        <div key={variant} className="w-72" data-demo={`overflow-${variant}`}>
                            <Tabs variant={variant} color="primary" defaultValue="overview">
                                <TabsList>
                                    {["Overview", "Timeline", "Messages", "Activity", "Documents"].map(
                                        (t) => (
                                            <TabsTab key={t} value={t.toLowerCase()}>
                                                {t}
                                            </TabsTab>
                                        ),
                                    )}
                                </TabsList>
                            </Tabs>
                        </div>
                    ))}
                    <p className="max-w-md text-sm">
                        No wrapper at the call site: <code>TabsList</code> carries this
                        itself, because a tab nobody can see is a tab that does not exist.
                    </p>
                </div>
            </Section>

            <Section title="Variants">
                {(["underline", "boxed", "pills"] as const).map((variant) => (
                    <Tabs key={variant} variant={variant} color="primary" defaultValue="a">
                        <TabsList>
                            <TabsTab value="a">Account</TabsTab>
                            <TabsTab value="b">Password</TabsTab>
                            <TabsTab value="c">Team</TabsTab>
                        </TabsList>
                    </Tabs>
                ))}
            </Section>

            <Section title="Real use · settings panels">
                <Tabs variant="boxed" color="primary" defaultValue="account" className="max-w-md">
                    <TabsList>
                        <TabsTab value="account">Account</TabsTab>
                        <TabsTab value="password">Password</TabsTab>
                        <TabsTab value="team">Team</TabsTab>
                    </TabsList>
                    <TabsPanel value="account">
                        <div className="flex flex-col gap-3 pt-4">
                            <Input placeholder="Full name" defaultValue="Ada Lovelace" />
                            <Input placeholder="Email" defaultValue="ada@silica.dev" />
                            <Button color="primary" className="w-fit">
                                Save
                            </Button>
                        </div>
                    </TabsPanel>
                    <TabsPanel value="password">
                        <div className="flex flex-col gap-3 pt-4">
                            <Input placeholder="Current password" type="password" />
                            <Input placeholder="New password" type="password" />
                            <Button color="primary" className="w-fit">
                                Update password
                            </Button>
                        </div>
                    </TabsPanel>
                    <TabsPanel value="team">
                        <p className="pt-4 opacity-70">4 members — 1 seat available.</p>
                    </TabsPanel>
                </Tabs>
            </Section>
        </>
    );
}
