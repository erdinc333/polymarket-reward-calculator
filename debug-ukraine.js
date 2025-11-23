const slug = "russia-x-ukraine-ceasefire-in-2025";

async function test() {
    try {
        const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) {
            console.log("Market not found");
            return;
        }

        const event = data[0];
        const market = event.markets[0];

        let tokenIds = market.clobTokenIds;
        let outcomes = market.outcomes;
        if (typeof tokenIds === 'string') tokenIds = JSON.parse(tokenIds);
        if (typeof outcomes === 'string') outcomes = JSON.parse(outcomes);

        console.log(`\n=== Market: ${market.question} (${slug}) ===`);

        for (let i = 0; i < tokenIds.length; i++) {
            const tokenId = tokenIds[i];
            const outcome = outcomes[i];

            const bookUrl = `https://clob.polymarket.com/book?token_id=${tokenId}`;
            const bookResp = await fetch(bookUrl);
            const orderBook = await bookResp.json();

            // Sort Bids (Desc) and Asks (Asc)
            const bids = (orderBook.bids || []).map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) })).sort((a, b) => b.price - a.price);
            const asks = (orderBook.asks || []).map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) })).sort((a, b) => a.price - b.price);

            const bestBid = bids.length > 0 ? bids[0].price : 0;
            const bestAsk = asks.length > 0 ? asks[0].price : 0;
            const midPrice = (bestBid + bestAsk) / 2;

            console.log(`\n  Outcome: ${outcome}`);
            console.log(`  Mid Price: ${midPrice.toFixed(4)} (Bid: ${bestBid}, Ask: ${bestAsk})`);

            const spreads = [0.01, 0.02, 0.03];

            spreads.forEach(spread => {
                const minBid = midPrice * (1 - spread);
                const maxAsk = midPrice * (1 + spread);

                const validBids = bids.filter(b => b.price >= minBid);
                const validAsks = asks.filter(a => a.price <= maxAsk);

                const bidUSD = validBids.reduce((acc, o) => acc + (o.size * o.price), 0);
                const askUSD = validAsks.reduce((acc, o) => acc + (o.size * o.price), 0);
                const totalUSD = bidUSD + askUSD;

                console.log(`    Spread ${spread * 100}%:`);
                console.log(`      Bids (Sell ${outcome}): $${bidUSD.toFixed(2)}`);
                console.log(`      Asks (Buy ${outcome}):  $${askUSD.toFixed(2)}`);
                console.log(`      Total Depth:        $${totalUSD.toFixed(2)}`);
            });
        }
    } catch (e) { console.log(`Error:`, e.message); }
}
test();
