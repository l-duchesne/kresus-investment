import ReactECharts from "echarts-for-react";
import React from "react";



type DoughnutChartProps = {
    data?: { name: string; value: string; percentage: string; color?: string }[];
    height?: string;
    total?: number;
};

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, total, height }) => {
    const option = {
        backgroundColor: "#1E1E1E",
        tooltip: { trigger: "item", formatter: "{b}: {c} € ({d}%)" },
        series: [
            {
                type: "pie",
                radius: ["60%", "85%"],
                center: ["50%", "50%"],
                label: {
                    show: true,
                    position: "center",
                    formatter: `{a|${total?.toFixed(2) ?? 0} €}\n{b|Total}`,
                    rich: {
                        a: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
                        b: { fontSize: 14, color: "#A0A0A0" },
                    },
                },
                data: data?.map(item => ({
                    name: item.name,
                    value: item.value,
                    itemStyle: { color: item.color }
                })),
            },
        ],
    };

    return <ReactECharts style={{ height }} option={option} />;
};

export default DoughnutChart;