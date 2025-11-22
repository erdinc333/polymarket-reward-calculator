export interface Market {
    id: string;
    question: string;
    slug: string;
    rewards: {
        min_incentive_size: number;
        max_incentive_spread: number;
        rates: {
            asset_address: string;
            rewards_daily_rate: number;
        }[];
    };
    tokens: {
        token_id: string;
        outcome: string;
        price: number;
    }[];
}

export interface OrderBook {
    bids: { price: string; size: string }[];
    asks: { price: string; size: string }[];
}

const GAMMA_API_URL = "/api/market";
const CLOB_API_URL = "/api/orderbook";

export async function getMarket(slug: string): Promise<Market | null> {
    try {
        // Fetch from our local proxy
        const response = await fetch(`${GAMMA_API_URL}?slug=${slug}`);
        if (!response.ok) throw new Error("Failed to fetch market");
        const data = await response.json();
        // The proxy returns the raw array from gamma-api
        if (Array.isArray(data) && data.length === 0) return null;

        // If it's an array, return the first item
        if (Array.isArray(data)) return data[0];

        return data;
    } catch (error) {
        console.error("Error fetching market:", error);
        return null;
    }
}

export async function getOrderBook(tokenId: string): Promise<OrderBook | null> {
    try {
        // Fetch from our local proxy
        const response = await fetch(`${CLOB_API_URL}?token_id=${tokenId}`);
        if (!response.ok) throw new Error("Failed to fetch order book");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching order book:", error);
        return null;
    }
}
