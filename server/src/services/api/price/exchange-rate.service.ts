import { LOG_ERR, LOG_INFO } from '@app/services';
import { AppCache } from '@app/config';
import axios from 'axios';

type SymbolsResponse = {
    currencies: {
        [symbol: string]: string;
    };
};

type ConversionsResponse = {
    quotes: {
        [symbol: string]: number;
    };
};

export type ExchangeRate = {
    id: string;
    desc: string;
    rate: number;
};

const getSymbols = async () => {
    const response = await axios.request<SymbolsResponse>({
        method: 'GET',
        url: 'http://api.exchangerate.host/list',
        params: {
            access_key: process.env.EXCHANGERATEHOST_API_KEY,
        },
    });
    AppCache.exchangeRates = [];
    const currencies = response.data.currencies;
    AppCache.exchangeRates.push({ id: 'USD', desc: 'United States Dollar', rate: 1 });
    for (const key in currencies) {
        AppCache.exchangeRates.push({
            id: key,
            desc: currencies[key],
            rate: 0,
        });
    }
};

const getConversions = async () => {
    const response = await axios.request<ConversionsResponse>({
        method: 'GET',
        url: 'http://api.exchangerate.host/live',
        params: {
            access_key: process.env.EXCHANGERATEHOST_API_KEY,
        },
    });
    const quotes = response.data.quotes;
    for (const currency of AppCache.exchangeRates) {
        if (currency.id !== 'USD') {
            currency.rate = quotes[`USD${currency.id}`];
        }
        AppCache.exchangeRates.sort((a,b) => (a.desc > b.desc) ? 1 : ((b.desc > a.desc) ? -1 : 0))
    }
};

/** This is called to update the Exchange Rate Data in the AppCache.  Reads price data from https://exchangerate.host. */
export const cacheExchangeRateData = async (): Promise<void> => {
    try {
        const start = LOG_INFO('Refreshing Exchange Rate Data');
        await getSymbols();
        await getConversions();
        LOG_INFO('Exchange Rate Data Updated', start);
    } catch (err) {
        LOG_ERR('cacheExchangeRateData', err);
    }
};
