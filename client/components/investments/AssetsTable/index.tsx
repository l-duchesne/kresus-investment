import React, { useState, useCallback } from "react";
import { getInvestmentByType } from '../../../store/backend';

type AssetProps = {
    datas: { name: string; value: number; percentage: string; type: string, color: string }[];
};

type AssetDetail = {
    detailName: string;
    detailValue: string;
};

const AssetsTable: React.FC<AssetProps> = ({ datas }) => {
    const [expandedRows, setExpandedRows] = useState<{ [key: number]: AssetDetail[] }>({});

    const handleRowClick = useCallback(async (index: number) => {
        if (expandedRows[index]) {
            setExpandedRows((prev) => {
                const newExpandedRows = { ...prev };
                delete newExpandedRows[index];
                return newExpandedRows;
            });
        } else {
            const res = await getInvestmentByType(datas[index].type); // Fetch new details from API
            if (res) {
                setExpandedRows((prev) => ({
                    ...prev,
                    [index]: res.details.filter((elt: any) => elt.valuation && elt.valuation !== 0)
                        .map((detail: any) => ({ detailName: detail.label, detailValue: detail.valuation })),
                }));
            } else {
                console.error("Expected an array of details");
            }
        }
    }, [datas, expandedRows]);

    return (
        <div className="bg-[#1E1E1E] p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Actifs</h2>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="text-left pb-2">Nom</th>
                        <th className="text-left pb-2">Répartition</th>
                        <th className="text-left pb-2">Valeur</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((data, index) => (
                        <React.Fragment key={index}>
                            <tr
                                className="border-b border-gray-800 cursor-pointer hover:text-black"
                                onClick={() => handleRowClick(index)}
                            >
                                <td className="py-2 flex items-center">
                                    <span className={`mr-2 transform transition-transform ${expandedRows[index] ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                    <span
                                        className="inline-block w-3 h-3 mr-2 rounded-full"
                                        style={{ backgroundColor: data.color }}
                                    ></span>
                                    {data.name}</td>
                                <td className="py-2">{data.percentage} %</td>
                                <td className="py-2 text-right">{data.value.toFixed(2)} €</td>
                            </tr>
                            {expandedRows[index] && (
                                <React.Fragment key={index}>
                                    {expandedRows[index].map((detail, detailIndex) => (
                                        <React.Fragment key={detailIndex}>

                                            <tr className="border-b border-gray-800 hover:text-black">
                                                <td className="py-2 pl-4">{detail.detailName}</td>
                                                <td className="py-2"> %</td>
                                                <td className="py-2 text-right">{parseFloat(detail.detailValue).toFixed(2)} €</td>
                                            </tr>
                                        </React.Fragment>


                                    ))}
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AssetsTable;