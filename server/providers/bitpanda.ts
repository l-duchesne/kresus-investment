import * as https from 'https';
import {
    FetchAccountsOptions,
    FetchTransactionsOptions,
    Provider,
    ProviderAccountResponse,
    ProviderInvestments,
    ProviderInvestmentsResponse,
    ProviderTransactionResponse
} from '.';
import { UserActionResponse } from '../../shared/types';
import { Account } from '../models';
import { accountTypeNameToId } from '../lib/account-types';


export const SOURCE_NAME = 'bitpanda';

interface Wallet {
    type: string;
    attributes: {
        cryptocoin_id: string;
        cryptocoin_symbol: string;
        balance: string;
        is_default: boolean;
        name: string;
        deleted: boolean;
        price: number
        is_index: boolean;
    };
    id: string;
}

interface AssetWalletResponse {
    data: {
        type: string;
        attributes: {
            cryptocoin?: {
                type: string;
                attributes: {
                    wallets: Wallet[];
                };
            };
            index?: {
                index?: {
                    type: string;
                    attributes: {
                        wallets: Wallet[];
                    };
                }
            };
            commodity?: {
                metal: {
                    type: string;
                    attributes: {
                        wallets: Wallet[];
                    };
                };
            };
        };
    };
    last_user_action: {
        date_iso8601: string;
        unix: string;
    };
}

class BitpandaClient {
    private apiKey: string;
    private priceApiUrl = 'https://min-api.cryptocompare.com/data/pricemulti';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public async getAssetWallets(): Promise<AssetWalletResponse> {
        try {
            const walletsResponse = await this.fetchAssetWallets();
            const wallets = walletsResponse.data.attributes.cryptocoin?.attributes.wallets || [];

            // Fetch prices for each wallet's cryptocoin symbol and add them to the wallet
            const priceData = await this.getCryptoPrice(wallets.map(w => w.attributes.cryptocoin_symbol));

            for (const wallet of wallets) {
                const cryptoSymbol = wallet.attributes.cryptocoin_symbol;
                if (priceData[cryptoSymbol]) {
                    wallet.attributes['price'] = priceData[cryptoSymbol].EUR;  // Ajoute le prix en EUR
                }
            }

            return walletsResponse;
        } catch (error) {
            console.log(error)
            throw new Error('Failed to fetch or parse asset wallets');
        }
    }

    private fetchAssetWallets(): Promise<AssetWalletResponse> {
        return new Promise((resolve, reject) => {
            const options: https.RequestOptions = {
                hostname: 'api.bitpanda.com',
                path: '/v1/asset-wallets',
                method: 'GET',
                headers: {
                    'X-Api-Key': this.apiKey
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData: AssetWalletResponse = JSON.parse(data);
                        resolve(parsedData);
                    } catch (error) {
                        reject(new Error('Failed to parse API response'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }

    public getCryptoPrice(symbols: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const param = symbols.join(',');
            console.log(`Fetching prices for symbols: ${param}`);

            const url = `${this.priceApiUrl}?fsyms=${param}&tsyms=EUR`;

            https.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        if (parsedData) {
                            resolve(parsedData);
                        } else {
                            reject(new Error('Cryptocurrency not found or invalid symbol'));
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse price API response'));
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }
}

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
        console.log(access)
        console.log(reject)
        resolve({
            kind: 'values',
            values: []
        });
    });
}


function mapToProviderInvestments(accountId: string, wallets: any[]): ProviderInvestments[] {
    return wallets.map(wallet => {
        const cryptoSymbol = wallet.attributes.cryptocoin_symbol;
        const quantity = wallet.attributes.balance;
        const unitprice = wallet.attributes.price
        const valuation = (parseFloat(quantity) * parseFloat(unitprice)).toFixed(2); // Calculer la valorisation

        const providerInvestment: ProviderInvestments = {
            account: accountId,
            externalId: wallet.id,
            label: wallet.attributes.name,
            quantity: quantity,
            unitprice: unitprice,
            unitvalue: unitprice,  // Ici, le prix de l'unité est la même valeur que le prix unitaire
            valuation: valuation,
            code: cryptoSymbol, // Code ou indice de la cryptomonnaie
            assetcategory: "crypto"
        };

        // Si tu souhaites ajouter la différence de valorisation, diff, et diff_ratio
        if (wallet.attributes.is_index) {
            providerInvestment.valuation = providerInvestment.quantity
            providerInvestment.unitvalue = "1"
            providerInvestment.unitvalue = "1"
        }

        return providerInvestment;
    });
}


export const fetchInvestments = ({ access }: FetchTransactionsOptions): Promise<ProviderInvestmentsResponse> => {
    return new Promise((resolve, reject) => {
        const privateBitpanda = new BitpandaClient(access.password!!);
        privateBitpanda.getAssetWallets().then(
            res => {

                let investments: ProviderInvestments[] = []
                if (res.data.attributes.cryptocoin?.attributes) {
                    investments = investments.concat(mapToProviderInvestments(access.login, res.data.attributes.cryptocoin?.attributes.wallets))
                }
                if (res.data.attributes.index?.index?.attributes) {
                    investments = investments.concat(mapToProviderInvestments(access.login, res.data.attributes.index?.index?.attributes.wallets))
                }

                resolve({
                    kind: 'values',
                    values: investments
                })


            }
        )
            .catch(e => reject(e))

    });
};


export const _: Provider = {
    SOURCE_NAME,
    fetchAccounts,
    fetchTransactions,
    fetchInvestments
};

