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
        clobTokenIds?: string[] | string;
        outcomes?: string[] | string;
        outcomePrices?: string[] | string;
        clobRewards?: {
            rewardsDailyRate: number;
        }[];
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

        console.log("Starting calculation...");

        try {
            // Extract slug from URL
            // Example: https://polymarket.com/event/presidential-election-winner-2024
            // Handle URLs with query parameters like ?tid=...
            // Also handle URLs that might end with a slash or have other segments
            // We want the segment after /event/ and before any ? or /
            const match = url.match(/event\/([^\/\?]+)/);
            if (!match) {
                throw new Error("Invalid Polymarket URL. Please use an event URL (e.g., https://polymarket.com/event/slug)");
            }
            const slug = match[1];
            console.log("Slug extracted:", slug);

            const marketData = await getMarket(slug);
            console.log("Market Data received:", marketData);

            if (!marketData) {
                throw new Error(`Market data not found for slug: ${slug}. Please check the URL.`);
            }

            const eventData = marketData as unknown as PolymarketEvent;
            let markets = eventData.markets || [];
            console.log("Initial markets array:", markets);

            if (markets.length === 0) {
                const potentialMarket = marketData as unknown as { question?: string; clobTokenIds?: unknown[] };
                if (potentialMarket.question && potentialMarket.clobTokenIds) {
                    markets = [marketData as unknown as PolymarketEvent['markets'][0]];
                    console.log("Using root object as market:", markets);
                } else {
                    console.error("No markets found in data structure");
                    throw new Error("No active markets found for this event.");
                }
            }

            const calculatedResults: CalculationResult[] = [];
            const investment = parseFloat(amount);

            if (isNaN(investment) || investment <= 0) {
                throw new Error("Please enter a valid investment amount.");
            }

            for (const market of markets) {
                console.log("Processing market:", market.question);

                let tokenIds = market.clobTokenIds || [];
                let outcomes = market.outcomes || [];

                // Parse if they are strings (API sometimes returns JSON stringified arrays)
                if (typeof tokenIds === 'string') {
                    try { tokenIds = JSON.parse(tokenIds); } catch (e) { console.error("Failed to parse tokenIds", e); tokenIds = []; }
                }
                if (typeof outcomes === 'string') {
                    try { outcomes = JSON.parse(outcomes); } catch (e) { console.error("Failed to parse outcomes", e); outcomes = []; }
                }

                if (tokenIds.length === 0) {
                    console.log("No clobTokenIds found for market:", market.question);
                    continue;
                }

                // Parse outcome prices
                let outcomePrices: number[] = [];
                if (typeof market.outcomePrices === 'string') {
                    try { outcomePrices = JSON.parse(market.outcomePrices).map((p: string) => parseFloat(p)); } catch (e) { console.error("Failed to parse outcomePrices", e); }
                } else if (Array.isArray(market.outcomePrices)) {
                    outcomePrices = market.outcomePrices.map((p: any) => parseFloat(p));
                }

                // If no prices found, assume equal distribution
                if (outcomePrices.length !== tokenIds.length) {
                    console.log("Outcome prices mismatch or missing, assuming equal split");
                    outcomePrices = new Array(tokenIds.length).fill(1 / tokenIds.length);
                }

                // Calculate total price sum to normalize if needed (usually sums to ~1)
                const totalProb = outcomePrices.reduce((a, b) => a + b, 0);

                // Calculate rewards for different spreads
                const spreads = [
                    { label: "+/- 1%", percent: 0.01 },
                    { label: "+/- 2%", percent: 0.02 },
                    { label: "+/- 3%", percent: 0.03 }
                ];

                // We will calculate the TOTAL reward for the market by summing up rewards from each outcome
                // based on the distributed investment.

                const marketResultsBySpread: { [key: string]: { totalReward: number, totalDepth: number, details: string[] } } = {};

                // Initialize results for each spread
                spreads.forEach(s => {
                    marketResultsBySpread[s.label] = { totalReward: 0, totalDepth: 0, details: [] };
                });

                // Iterate over all outcomes (e.g. Yes and No, or multiple options)
                for (let i = 0; i < tokenIds.length; i++) {
                    const tokenId = tokenIds[i];
                    const outcome = outcomes[i] || `Outcome ${i + 1}`;
                    const price = outcomePrices[i] || 0;

                    // Distribute investment based on price/probability
                    // Investment for this outcome = Total Investment * (Price / TotalProb)
                    const allocatedInvestment = investment * (price / totalProb);

                    console.log(`Processing Token: ${tokenId} (${outcome}) - Price: ${price}, Allocated: $${allocatedInvestment.toFixed(2)}`);

                    const orderBook = await getOrderBook(tokenId);
                    if (!orderBook) {
                        console.log("No orderbook found for token:", tokenId);
                        continue;
                    }

                    // Use clobRewards for daily rate
                    // Note: The daily rate is usually for the whole market. 
                    // If we are calculating per outcome and summing, we need to know if the rate is split.
                    // Usually, providing liquidity on ALL outcomes is required/incentivized.
                    // We will assume the "Reward Share" logic applies per outcome's depth contribution.
                    // But to avoid over-estimating (e.g. summing full daily rate multiple times), 
                    // we should consider if the daily rate is a single pool.
                    // If it's a single pool, we are calculating our share of the TOTAL pool.
                    // Share = (MyLiquidity / TotalLiquidity) * DailyRate.
                    // But the user asked to sum them. 
                    // Let's calculate the "Effective Reward" for this allocated portion.
                    // If I have $100 here and depth is $1000, I own 10% of THIS outcome's liquidity.
                    // Does that mean I get 10% of the TOTAL daily reward? No, probably weighted by outcome probability or just volume.
                    // HOWEVER, to strictly follow "distribute and sum":
                    // We will assume the Daily Rate is available for the *Market*.
                    // We will calculate the share for this outcome and assume it contributes that fraction to the total reward.
                    // To prevent blowing up the numbers, we'll weight the Daily Reward by the outcome price (probability),
                    // assuming the reward pool is effectively distributed to outcomes based on their probability/importance.
                    // OR, we just calculate the raw share and sum it, but warn it might be an estimation.
                    // Let's use the "Share of Liquidity" approach which is safest.
                    // But we need to do it per spread.

                    const dailyReward = market.clobRewards?.[0]?.rewardsDailyRate || 0;

                    const bids = (orderBook.bids || []).map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }));
                    const asks = (orderBook.asks || []).map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }));

                    // Find mid price
                    const bestBid = bids.length > 0 ? bids[0].price : 0;
                    const bestAsk = asks.length > 0 ? asks[0].price : 0;
                    const midPrice = (bestBid + bestAsk) / 2 || price; // Fallback to market price

                    for (const spread of spreads) {
                        const minBidPrice = midPrice * (1 - spread.percent);
                        const maxAskPrice = midPrice * (1 + spread.percent);

                        const validBids = bids.filter(b => b.price >= minBidPrice);
                        const validAsks = asks.filter(a => a.price <= maxAskPrice);

                        const depthBids = validBids.reduce((acc, order) => acc + order.size, 0);
                        const depthAsks = validAsks.reduce((acc, order) => acc + order.size, 0);
                        const currentDepth = depthBids + depthAsks;

                        // Calculate share for this outcome
                        // We weight the daily reward by the price to simulate "distributed pool"
                        // RewardForOutcome = (DailyRate * Price) * (AllocatedInv / (CurrentDepth + AllocatedInv))
                        // This ensures that if you provide liquidity on all outcomes proportional to price, 
                        // your total reward sums up to roughly (DailyRate * TotalShare).

                        const outcomeDailyRewardPool = dailyReward * (price / totalProb);
                        const userShare = allocatedInvestment / (currentDepth + allocatedInvestment);
                        const estimatedRewardPart = outcomeDailyRewardPool * userShare;

                        marketResultsBySpread[spread.label].totalReward += estimatedRewardPart;
                        marketResultsBySpread[spread.label].totalDepth += currentDepth;
                        marketResultsBySpread[spread.label].details.push(`${outcome}: $${estimatedRewardPart.toFixed(2)} (Depth: $${currentDepth.toFixed(0)})`);
                    }
                }

                // Push results for this market (one row per spread)
                spreads.forEach(spread => {
                    const res = marketResultsBySpread[spread.label];
                    calculatedResults.push({
                        question: market.question,
                        outcome: "All Outcomes (Summed)",
                        currentDepth: res.totalDepth,
                        estimatedReward: res.totalReward,
                        dailyRewardPool: market.clobRewards?.[0]?.rewardsDailyRate || 0,
                        spread: spread.label
                    });
                });
            }

            console.log("Final Results:", calculatedResults);
            setResults(calculatedResults);

        } catch (err: unknown) {
            console.error("Error in calculation:", err);
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
