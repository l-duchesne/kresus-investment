import ReactECharts from "echarts-for-react";
import React from "react";


type LineChartProps = {
    data?: number[];
};
const LineChart: React.FC<LineChartProps> = ({ data }) => {
    const option = {
        backgroundColor: "#1E1E1E",
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: ["Jan", "Fév", "Mar", "Avr"] },
        yAxis: { type: "value" },
        series: [
            {
                data: data,
                type: "line",
                smooth: true,
                lineStyle: { color: "#6A5ACD" },
            },
        ],
    };

    return <ReactECharts option={option} style={{ height: "300px" }} />;
};

export default LineChart;