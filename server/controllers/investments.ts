
import { IdentifiedRequest } from "./routes";
import express from 'express';
import { runStartupTasks } from './all'
import {
    makeLogger,
    asyncErr
} from '../helpers';
import Investment from "../models/entities/investments";


const log = makeLogger('controllers/investments');

const ERR_MSG_LOADING_INVESTMETNS = "Error when loading investment data"

export enum WeathTypeDtoSchema {
    STOCK_MARKET = "stock_market",
    REAL_ESTATE_ACTIVE = "real_estate_active",
    REAL_ESTATE_PASSIVE = "real_estate_passive",
    SAVINGS = "savings",
    CRYPTO_CURRENCY = "crypto",
    CURRENCY = "currency"
}



type SummaryDetailDto = {
    type: WeathTypeDtoSchema
    value: number
    percentage: number
}

type AllInvestment = {
    grossSum: number
    netSum: number
    details: SummaryDetailDto[]
};

type AllTypedInvestment = {
    grossSum: number
    netSum: number
    details: Investment[]
};




export async function sumary(req: IdentifiedRequest<any>, res: express.Response) {
    try {
        const { id: userId } = req.user;
        await runStartupTasks(userId);
        const ret = await getAllData(userId);
        res.status(200).json(ret);
    } catch (err) {
        err.code = ERR_MSG_LOADING_INVESTMETNS;
        asyncErr(res, err, 'when loading all data');
    }
}
export async function sumaryByType(req: IdentifiedRequest<any>, res: express.Response) {
    try {
        const { id: userId } = req.user;
        const type = req.params.type;
        log.info("Call for type " + type)
        const ret = await getAllDataByType(userId, type);
        res.status(200).json(ret);
    } catch (err) {
        err.code = ERR_MSG_LOADING_INVESTMETNS;
        asyncErr(res, err, 'when loading all data');
    }
}



async function getAllData(userId: number): Promise<AllInvestment> {
    let res: AllInvestment = {
        grossSum: 0,
        netSum: 0,
        details: []
    }
    const investments = await Investment.all(userId);

    const groupedAndFilled = await groupAndFillInvestments(investments);

    const groupedByDate = await groupByDate(groupedAndFilled);

    const list = await getGroupWithMostRecentDate(groupedByDate);

    const groupedResults = groupAndSumByType(list);

    res.details = mapGroupedResults(groupedResults);

    let sum = 0;
    for (let detail of res.details) {
        if (detail.value) {
            sum += detail.value;
        }
    }

    res.grossSum = sum;
    res.netSum = sum;

    res.details.forEach(elt => elt.percentage = elt.value * 100 / sum);
    console.log('Final Result:', res);
    return res
}


async function getAllDataByType(userId: number, type: string): Promise<AllTypedInvestment> {
    let res: AllTypedInvestment = {
        grossSum: 0,
        netSum: 0,
        details: []
    }
    const investments = await Investment.byType(userId, type.toUpperCase());
    const groupedAndFilled = await groupAndFillInvestments(investments);
    const groupedByDate = await groupByDate(groupedAndFilled);
    let list = await getGroupWithMostRecentDate(groupedByDate);

    res.details = removeDuplicateInvestments(list)
    let sum = 0
    for (let investment of res.details) {
        if (investment.valuation) {
            sum = sum + investment.valuation
        }

    }
    res.grossSum = sum
    res.netSum = sum
    return res
}




function mapGroupedResults(groupedResults: Record<WeathTypeDtoSchema, { totalQuantity: number; totalValuation: number }>) {
    return Object.keys(groupedResults).map(type => ({
        type: type as WeathTypeDtoSchema,           // Convert type with `toType`
        value: groupedResults[type as WeathTypeDtoSchema].totalValuation,  // Get the total valuation,
        percentage: 0
    }));
}

function groupAndSumByType(investments: Investment[]): Record<WeathTypeDtoSchema, { totalQuantity: number; totalValuation: number }> {
    return investments.reduce((result, investment) => {
        const { type, quantity, valuation } = investment;
        const newType = toType(type)

        // Initialiser le groupe s'il n'existe pas
        if (!result[newType]) {
            result[newType] = {
                totalQuantity: 0,
                totalValuation: 0,
            };
        }

        // Ajouter les valeurs actuelles au groupe
        if (quantity) {
            result[newType].totalQuantity += Number(quantity);
        }

        if (valuation) {
            result[newType].totalValuation += Number(valuation);
        }

        return result;
    }, {} as Record<string, { totalQuantity: number; totalValuation: number }>);
}

function toType(type: string): WeathTypeDtoSchema {
    if (type === 'CRYPTO') {
        return WeathTypeDtoSchema.CRYPTO_CURRENCY
    }
    else if (type === 'SAVINGS') {
        return WeathTypeDtoSchema.SAVINGS
    }
    else if (type === 'STOCK_MARKET') {
        return WeathTypeDtoSchema.STOCK_MARKET
    }
    else if (type === 'REAL_ESTATE_ACTIVE') {
        return WeathTypeDtoSchema.REAL_ESTATE_ACTIVE
    }
    return WeathTypeDtoSchema.CURRENCY;
}

async function groupAndFillInvestments(investments: Investment[]): Promise<Record<number, Investment[]>> {
    // Grouper les investissements par id
    const groupedInvestments: Record<number, Investment[]> = investments.reduce((acc, investment) => {
        if (!acc[investment.id]) {
            acc[investment.id] = [];
        }
        acc[investment.id].push(investment);
        return acc;
    }, {} as Record<number, Investment[]>);

    // Identifier les dates uniques dans l'ensemble des investissements
    const allDates = Array.from(new Set(investments.map(inv => inv.date.toISOString().split('T')[0]))).sort();

    // Remplir les dates manquantes pour chaque groupe
    for (const id in groupedInvestments) {
        const group = groupedInvestments[id];

        // Trier les investissements par date
        group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Compléter les dates manquantes
        const completedGroup: Investment[] = [];
        let lastInvestment: Investment | null = null;

        for (const date of allDates) {
            const existingInvestment = group.find(inv => inv.date.toISOString().split('T')[0] === date);

            if (existingInvestment) {
                completedGroup.push(existingInvestment);
                lastInvestment = existingInvestment;
            } else if (lastInvestment) {
                // Dupliquer le dernier élément pour la date manquante
                const duplicatedInvestment = { ...lastInvestment, date: new Date(date) };
                completedGroup.push(duplicatedInvestment);
            }
        }

        groupedInvestments[id] = completedGroup;
    }

    return groupedInvestments;
}

async function groupByDate(investmentsById: Record<number, Investment[]>): Promise<Record<string, Investment[]>> {
    const groupedByDate: Record<string, Investment[]> = {};

    for (const id in investmentsById) {
        for (const investment of investmentsById[id]) {
            const dateKey = investment.date.toISOString().split('T')[0]; // Format YYYY-MM-DD

            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }

            groupedByDate[dateKey].push(investment);
        }
    }

    return groupedByDate;
}

async function getGroupWithMostRecentDate(groupedByDate: Record<string, Investment[]>): Promise<Investment[]> {
    // Extraire toutes les dates sous forme d'objets Date
    const dates = Object.keys(groupedByDate).map(dateKey => new Date(dateKey));

    // Trouver la date la plus récente
    const mostRecentDate = dates.reduce((latest, current) => (current > latest ? current : latest), new Date(0));

    // Convertir la date en format clé (YYYY-MM-DD)
    const mostRecentDateKey = mostRecentDate.toISOString().split('T')[0];

    // Retourner le groupe associé à cette date
    return groupedByDate[mostRecentDateKey] || [];
}

function removeDuplicateInvestments(investments: Investment[]): Investment[] {
    const uniqueInvestments = new Map<string, Investment>();

    for (const investment of investments) {
        const key = `${investment.userId}-${investment.accountId}-${investment.code}`;
        // Garder uniquement l'investissement le plus récent
        if (!uniqueInvestments.has(key) || uniqueInvestments.get(key)!.date < investment.date) {
            uniqueInvestments.set(key, investment);
        }
    }

    return Array.from(uniqueInvestments.values());
}