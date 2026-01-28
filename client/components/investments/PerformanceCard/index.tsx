import React from "react";

type PerformanceProps = {
    value: number;
    percentage: number;
};

const PerformanceCard: React.FC<PerformanceProps> = ({ value, percentage }) => {
    return (
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
            <h2 className="text-lg font-semibold">Performance</h2>
            <p className="text-red-500 text-3xl font-bold mt-2">{value} €</p>
            <p className="text-red-400 text-sm">{percentage}%</p>
            <p className="text-gray-400 text-sm mt-2">
                La plus-value latente est la différence entre le prix d'achat et le prix
                actuel.
            </p>
        </div>
    );
};

export default PerformanceCard;