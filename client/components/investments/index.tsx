import React, { useState, useEffect, useCallback } from "react";
import PerformanceCard from "./PerformanceCard";
import LineChart from "./linechart";
import DoughnutChart from "./DoughnutChart";
import AssetsTable from "./AssetsTable";
import { useGenericError } from '../../hooks';
import { getInvestment } from '../../store/backend';
import { SumaryInvestements } from '../../models';

const Dashboard = () => {
    const [summaryInvestment, setSummaryInvestment] = useState<SumaryInvestements | null>(null);

    const fetch = useGenericError(
        useCallback(async () => {
            const results = (await getInvestment()) as SumaryInvestements;
            setSummaryInvestment(results);
        }, [])
    );

    useEffect(() => {
        fetch();
    }, [fetch]);

    const transformTitle = (str: string): string => {
        if (str === 'savings') return 'Épargne';
        if (str === 'crypto') return 'Crypto';
        if (str === 'stock_market') return 'Actions';
        if (str === 'real_estate_active') return 'Immobilier actif';
        if (str === 'real_estate_passive') return 'Immobilier passif';
        if (str === 'currency') return 'Liquidités';
        // Implement your string transformation logic here
        return str.toUpperCase(); // Example transformation
    };

    if (!summaryInvestment) {
        return <div>Loading...</div>;
    }

    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];


    return (
        <div className="content-investment min-h-screen text-white p-6 space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Patrimoine brut</h1>
                <div className="bg-[#1E1E1E] px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer">
                    <span className="text-sm text-gray-400">Toutes les catégories</span>
                </div>
            </div>

            {/* GRAPHIQUE + PERFORMANCE */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-[#1E1E1E] p-4 rounded-lg">
                    <LineChart />
                </div>
                <PerformanceCard value={-1779} percentage={-1.04} />
            </div>

            {/* LISTE DES ACTIFS + CHART DOUGHNUT */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-[#1E1E1E] p-4 rounded-lg">
                    <AssetsTable datas={summaryInvestment.details.map((elt, index) => {
                        return {
                            value: elt.value,
                            name: transformTitle(elt.type),
                            percentage: elt.percentage.toFixed(2),
                            type: elt.type,
                            color: colors[index % colors.length]
                        }
                    })} />
                </div>
                <div className="bg-[#1E1E1E] p-4 rounded-lg">
                    <DoughnutChart
                        data={summaryInvestment.details.map((elt, index) => {
                            return { value: elt.value.toFixed(2), percentage: elt.percentage.toFixed(2), name: transformTitle(elt.type), color: colors[index % colors.length] }
                        })} total={summaryInvestment.netSum}
                        height="300px"
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;