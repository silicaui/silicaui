import { Chart, Sparkline } from "silicaui-charts";
import type { EChartsOption } from "silicaui-charts";
import { Section, Row } from "../lib/Section";

const REVENUE_OPTION: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Revenue", "Orders"], top: 0 },
    grid: { left: 4, right: 8, top: 34, bottom: 4, containLabel: true },
    xAxis: {
        type: "category",
        data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    },
    yAxis: [{ type: "value" }, { type: "value", splitLine: { show: false } }],
    series: [
        {
            name: "Revenue",
            type: "line",
            yAxisIndex: 0,
            smooth: true,
            areaStyle: { opacity: 0.12 },
            data: [8200, 9310, 9020, 11200, 12800, 12010, 14300],
        },
        {
            name: "Orders",
            type: "bar",
            yAxisIndex: 1,
            data: [120, 132, 128, 151, 168, 160, 184],
        },
    ],
};

const CHANNEL_OPTION: EChartsOption = {
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
        {
            name: "Channel",
            type: "pie",
            radius: ["45%", "72%"],
            itemStyle: { borderRadius: 6 },
            label: { show: false },
            data: [
                { value: 4200, name: "Direct" },
                { value: 3100, name: "Organic" },
                { value: 2400, name: "Referral" },
                { value: 1600, name: "Social" },
            ],
        },
    ],
};

export function ChartDemo() {
    return (
        <>
            <Section title="Real use · revenue trend (auto-themed ECharts)">
                <Chart option={REVENUE_OPTION} style={{ maxWidth: 640 }} />
            </Section>

            <Section title="Channel split">
                <Chart option={CHANNEL_OPTION} style={{ maxWidth: 420, height: "18rem" }} />
            </Section>

            <Section title="Sparklines · inline trend indicators">
                <Row>
                    <Sparkline
                        data={[8, 9, 9, 11, 12, 12, 14]}
                        area
                        style={{ width: "8rem", height: "2.5rem" }}
                    />
                    <Sparkline
                        data={[14, 12, 12, 11, 9, 9, 8]}
                        style={{ width: "8rem", height: "2.5rem" }}
                    />
                </Row>
            </Section>
        </>
    );
}
