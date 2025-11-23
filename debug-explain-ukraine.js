const slug = "russia-x-ukraine-ceasefire-in-2025";
const investment = 1000; // Example investment

async function test() {
    try {
        const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) return;

        const event = data[0];
        const market = event.markets[0];
        const dailyReward = market.clobRewards?.[0]?.rewardsDailyRate || 0;

        let tokenIds = JSON.parse(market.clobTokenIds);
        let outcomes = JSON.parse(market.outcomes);

        console.log(`\nMarket: ${market.question}`);
        console.log(`Daily Reward Pool: $${dailyReward}`);
        console.log(`User Investment: $${investment}`);

        for (let i = 0; i < tokenIds.length; i++) {
            const tokenId = tokenIds[i];
            const outcome = outcomes[i];

            const bookUrl = `https://clob.polymarket.com/book?token_id=${tokenId}`;
            const bookResp = await fetch(bookUrl);
            const orderBook = await bookResp.json();

            const bids = (orderBook.bids || []).map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) })).sort((a, b) => b.price - a.price);
            const asks = (orderBook.asks || []).map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) })).sort((a, b) => a.price - b.price);

            const bestBid = bids.length > 0 ? bids[0].price : 0;
            const bestAsk = asks.length > 0 ? asks[0].price : 0;
            const midPrice = (bestBid + bestAsk) / 2;

            console.log(`\n--- Outcome: ${outcome} (Mid: ${midPrice.toFixed(4)}) ---`);

            const spreads = [0.01, 0.02, 0.03];

            spreads.forEach(spread => {
                const minBid = midPrice - spread;
                const maxAsk = midPrice + spread;

                const validBids = bids.filter(b => b.price >= minBid);
                const validAsks = asks.filter(a => a.price <= maxAsk);

                const depthUSD = validBids.reduce((acc, o) => acc + (o.size * o.price), 0) + validAsks.reduce((acc, o) => acc + (o.size * o.price), 0);

                // Formula: DailyReward * (UserInv / (Depth + UserInv))
                // Note: We assume the Daily Reward is split among outcomes proportional to price (or just show the raw share calculation)
                // For this explanation, let's show the raw share of the TOTAL depth.

                const userShare = investment / (depthUSD + investment);
                const estReward = dailyReward * userShare; // Simplified for explanation

                console.log(`\n  Spread +/- ${spread * 100} cent (${minBid.toFixed(2)} - ${maxAsk.toFixed(2)}):`);
                console.log(`    Total Depth: $${depthUSD.toFixed(2)}`);
                console.log(`    Calculation: ${dailyReward} * (${investment} / (${depthUSD.toFixed(0)} + ${investment})) = $${estReward.toFixed(2)}`);

                console.log(`    Top 3 Bids in range:`);
                validBids.slice(0, 3).forEach(b => console.log(`      Price: ${b.price}, Size: ${b.size.toFixed(0)} ($${(b.price * b.size).toFixed(2)})`));

                console.log(`    Top 3 Asks in range:`);
                validAsks.slice(0, 3).forEach(a => console.log(`      Price: ${a.price}, Size: ${a.size.toFixed(0)} ($${(a.price * a.size).toFixed(2)})`));
            });
        }
    } catch (e) { console.log(e); }
}
test();
