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

const GAMMA_API_URL = "https://gamma-api.polymarket.com";
const CLOB_API_URL = "https://clob.polymarket.com";

export async function getMarket(slug: string): Promise<Market | null> {
    try {
        const response = await fetch(`${GAMMA_API_URL}/events?slug=${slug}`);
        if (!response.ok) throw new Error("Failed to fetch market");
        const data = await response.json();
        if (data.length === 0) return null;

        // The events endpoint returns an array of events. 
        // We need to find the specific market within the event or just return the event data if it maps 1:1 for our purpose.
        // For simplicity, let's assume we want the first market in the event for now, or we need to refine how we get the specific market ID.
        // Actually, the user pastes a link like https://polymarket.com/event/presidential-election-winner-2024
        // The slug is "presidential-election-winner-2024".
        // The API returns the event which contains markets.

        return data[0];
    } catch (error) {
        console.error("Error fetching market:", error);
        return null;
    }
}

export async function getOrderBook(tokenId: string): Promise<OrderBook | null> {
    try {
        const response = await fetch(`${CLOB_API_URL}/book?token_id=${tokenId}`);
        if (!response.ok) throw new Error("Failed to fetch order book");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching order book:", error);
        return null;
    }
}
