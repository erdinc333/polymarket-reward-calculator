"use client";

import { useState } from "react";
import { getMarket, getOrderBook } from "@/lib/polymarket";
import { Loader2, Search, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface CalculationResult {
    question: string;
    outcome: string;
    currentDepth: number;
    estimatedReward: number;
    dailyRewardPool: number;
    spread: string;
}

// Define a type for the event response which contains markets
interface PolymarketEvent {
    markets: {
        question: string;
        tokens: {
            token_id: string;
            outcome: string;
        }[];
        rewards?: { // rewards can be optional
            rates?: { // rates can be optional
                rewards_daily_rate: number;
            }[];
        };
    }[];
}

export function RewardCalculator() {
    const [url, setUrl] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<CalculationResult[]>([]);
    const [error, setError] = useState("");

    const handleCalculate = async () => {
        setLoading(true);
        setError("");
        setResults([]);

        try {
            // Extract slug from URL
            // Example: https://polymarket.com/event/presidential-election-winner-2024
            const match = url.match(/event\/([^\/]+)/);
            if (!match) {
                throw new Error("Invalid Polymarket URL. Please use an event URL (e.g., https://polymarket.com/event/slug)");
            }
            const slug = match[1];

            const marketData = await getMarket(slug);
            if (!marketData) {
                throw new Error("Market not found or API error.");
            }

            // Cast to our defined event type
            const eventData = marketData as unknown as PolymarketEvent;
            let markets = eventData.markets || [];

            if (markets.length === 0) {
                // Fallback: if the API returns a single market object instead of an event with markets
                // Check if the root object itself looks like a market.
                // We cast to unknown first to avoid 'any' lint error, then to a shape we can check.
                const potentialMarket = marketData as unknown as { question?: string; tokens?: unknown[] };

                if (potentialMarket.question && potentialMarket.tokens) {
                    // We need to cast it to the type expected by the markets array
                    // The Market interface from lib/polymarket is compatible enough for our usage here
                    // but we need to ensure it matches the structure we iterate over.
                    // Let's just cast it to the type of an item in the markets array.
                    markets = [marketData as unknown as PolymarketEvent['markets'][0]];
                } else {
                    throw new Error("No active markets found for this event.");
                }
            }

            const calculatedResults: CalculationResult[] = [];
            const investment = parseFloat(amount);

            if (isNaN(investment) || investment <= 0) {
                throw new Error("Please enter a valid investment amount.");
            }

            for (const market of markets) {
                const token = market.tokens?.[0]; // Usually YES or NO
                if (!token) continue;

                const orderBook = await getOrderBook(token.token_id);
                if (!orderBook) continue;

                const dailyReward = market.rewards?.rates?.[0]?.rewards_daily_rate || 0;

                const bids = orderBook.bids.map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }));
                const asks = orderBook.asks.map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }));

                const currentDepth = [...bids.slice(0, 5), ...asks.slice(0, 5)].reduce((acc, order) => acc + order.size, 0);

                const userShare = investment / (currentDepth + investment);
                const estimatedReward = dailyReward * userShare;

                calculatedResults.push({
                    question: market.question,
                    outcome: token.outcome,
                    currentDepth,
                    estimatedReward,
                    dailyRewardPool: dailyReward,
                    spread: "Top 5 levels"
                });
            }

            setResults(calculatedResults);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Polymarket Event URL</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="https://polymarket.com/event/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Investment Amount ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <input
                                type="number"
                                placeholder="1000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <TrendingUp />}
                    Calculate Rewards
                </button>

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        <p>{error}</p>
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="grid gap-4">
                    {results.map((res, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                            <h3 className="text-xl font-semibold text-white mb-2">{res.question}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Outcome</p>
                                    <p className="text-white font-medium">{res.outcome}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Daily Pool</p>
                                    <p className="text-green-400 font-medium">{res.dailyRewardPool > 0 ? `${res.dailyRewardPool.toFixed(2)}` : "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Current Depth</p>
                                    <p className="text-white font-medium">${res.currentDepth.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Est. Daily Reward</p>
                                    <p className="text-blue-400 font-bold text-lg">
                                        {res.dailyRewardPool > 0 ? `$${res.estimatedReward.toFixed(2)}` : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
