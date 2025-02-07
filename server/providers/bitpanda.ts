// This modules implements a manual access where the user fills the transactions themselves.

import { accountTypeNameToId } from '../lib/account-types';
import {
    FetchAccountsOptions,
    FetchTransactionsOptions,
    Provider,
    ProviderAccountResponse,
    ProviderInvestmentsResponse,
    ProviderTransactionResponse,
    ProviderInvestments
} from '.';
import Account from '../models/entities/accounts';
import { UserActionResponse } from '../../shared/types';
import * as https from 'https';
import { IncomingMessage } from 'http';

export const SOURCE_NAME = 'bitpanda';

const BitPandaURL = "https://api.bitpanda.com/v1";

export const fetchAccounts = async (
    opts: FetchAccountsOptions
): Promise<ProviderAccountResponse> => {
    // If there are existing accounts, return them.
    const accounts = await Account.byAccess(opts.access.userId, opts.access);
    if (accounts.length) {
        return {
            kind: 'values',
            values: accounts.map(acc => ({
                vendorAccountId: acc.vendorAccountId,
                label: acc.label,
                currency: acc.currency || 'EUR',
                type: accountTypeNameToId(acc.type),
            })),
        };
    }

    // test call apis
    return {
        kind: 'values',
        values: [
            {
                vendorAccountId: opts.access.login,
                label: `Bitpanda #1`,
                // No balance
                currency: 'EUR',
                type: 100,
            }
        ],
    };
};

export async function fetchTransactions(
    { access }: FetchTransactionsOptions
): Promise<ProviderTransactionResponse | UserActionResponse> {
    return new Promise((resolve, reject) => {
        const url = new URL(BitPandaURL + '/trades?page_size=200');
        const req = https.request(
            url,
            {
                method: 'GET',
                headers: {
                    'X-API-KEY': access.password!!,
                },
            },
            (response: IncomingMessage) => {
                let body = '';

                // Collect data chunks
                response.on('data', (chunk) => {
                    body += chunk;
                });

                // On response end
                response.on('end', () => {
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        try {
                            const parsedBody = JSON.parse(body);
                            const data = parsedBody.data || [];

                            const output = data.map((trade: any) => ({
                                account: access.login,
                                amount: trade.attributes.amount_fiat,
                                label: trade.attributes.cryptocoin_id,
                                type: getType(trade.attributes.type),
                                date: trade.attributes.time.date_iso8601,
                            }));

                            resolve({ kind: 'values', values: output });
                        } catch (e) {
                            console.error('Error parsing response body:', e);
                            resolve({ kind: 'values', values: [] });
                        }
                    } else {
                        console.error('Error fetching trades:', response.statusCode, body);
                        reject(new Error(`Request failed with status ${response.statusCode}`));
                    }
                });
            }
        );

        // Handle request errors
        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        // End the request
        req.end();
    });
}

function getType(type: string): string {
    if (type === 'buy') {
        return '2'
    }
    else if (type === 'sell') {
        return '5'
    }
    else {
        return '1'
    }
}

export const fetchInvestments = ({ access }: FetchTransactionsOptions): Promise<ProviderInvestmentsResponse> => {
    return new Promise((resolve, reject) => {
        const url = new URL(BitPandaURL + '/asset-wallets');
        const options = {
            method: 'GET',
            headers: {
                'X-API-KEY': access.password!, // Replace with your actual API key
            },
        };

        // Choose the appropriate request method (http or https based on the URL)
        const req = https.request(url, options, (res) => {
            let data = '';

            // Concatenate data chunks as they arrive
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Once the response is finished, parse the data and process it
            res.on('end', async () => {
                try {
                    const response = JSON.parse(data);

                    const walletsData = response.data.attributes.cryptocoin.attributes.wallets;
                    let output: ProviderInvestments[] = [];
                    const coinsList = await getCryptoList();
                    const coinIds = [];

                    for (let i = 0; i < walletsData.length; i++) {
                        output.push({
                            account: access.login,
                            externalId: walletsData[i].id,
                            assetcategory: 'crypto',
                            code: walletsData[i].attributes.cryptocoin_id,
                            stocksymbol: walletsData[i].attributes.cryptocoin_symbol,
                            valuation: '0',
                            label: walletsData[i].attributes.name,
                            unitprice: '0',
                            unitvalue: '0',
                            quantity: walletsData[i].attributes.balance
                        });
                        coinIds.push(await getCryptoId(coinsList, walletsData[i].attributes.cryptocoin_symbol));
                    }


                    const dataIndex = response.data.attributes.index.index.attributes.wallets;
                    for (let i = 0; i < dataIndex.length; i++) {
                        const elt = dataIndex[i];
                        output.push({
                            account: access.login,
                            externalId: elt.id,
                            assetcategory: 'index',
                            code: elt.attributes.cryptocoin_id,
                            stocksymbol: elt.attributes.cryptocoin_symbol,
                            valuation: elt.attributes.balance,
                            label: elt.attributes.name,
                            unitprice: '0',
                            unitvalue: '0',
                            quantity: '0'
                        });
                    }

                    const prices = await getCryptoPrices(coinIds);
                    for (const res of output) {
                        if (res.assetcategory !== 'index') {
                            const cryptoId = await getCryptoId(coinsList, res.stocksymbol!!);
                            if (cryptoId) {

                                const price = prices[cryptoId]?.eur;
                                console.error(`${cryptoId} -- ${price}`);
                                res.unitprice = price;
                                res.valuation = `${price * parseFloat(res.quantity)}`
                            }
                        }

                    }

                    resolve({
                        kind: 'values',
                        values: output
                    });
                } catch (e) {
                    reject(e); // Reject with error if any parsing issues occur
                }
            });
        });

        req.on('error', (e) => {
            reject(e); // Reject if there is an error with the request
        });

        req.end(); // Finalize the request
    });
};

// Function to get the list of cryptocurrencies from CoinGecko
const getCryptoList = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const url = 'https://api.coingecko.com/api/v3/coins/list';
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });
    });
};

// Function to get crypto ID from the list
const getCryptoId = (coins: any[], symbol: string): string | null => {
    for (const coin of coins) {
        if (coin.symbol.toLowerCase() == symbol.toLowerCase()) {
            console.error(`${coin.symbol}  --- ${coin.name} --- ${symbol} `)
            return coin.id;
        }
    }
    return null;
};

// Function to get crypto prices from CoinGecko
const getCryptoPrices = (cryptoIds: (string | null)[], currency = 'eur'): Promise<any> => {
    return new Promise((resolve, reject) => {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=${currency}`;
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });
    });
};

export const _: Provider = {
    SOURCE_NAME,
    fetchAccounts,
    fetchTransactions,
    fetchInvestments
};
