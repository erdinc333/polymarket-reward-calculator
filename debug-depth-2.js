const slugs = [
    "will-elon-musk-be-times-person-of-the-year-for-2025",
    "will-elon-musk-be-time-person-of-the-year-for-2025",
    "will-elon-musk-be-times-person-of-the-year-2025",
    "will-elon-musk-be-time-person-of-the-year-2025"
];

async function test() {
    let market = null;
    let event = null;

    for (const slug of slugs) {
        try {
            const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
            console.log(`Trying slug: ${slug}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data && data.length > 0) {
                event = data[0];
                market = event.markets[0];
                console.log("Found Market:", market.question);
                break;
            }
        } catch (e) { console.log("Error fetching slug:", slug); }
    }

    if (!market) {
        console.log("Could not find market with guessed slugs.");
        return;
    }

    const tokenIds = JSON.parse(market.clobTokenIds);
    const outcomes = JSON.parse(market.outcomes);

    const spreads = [0.01, 0.02, 0.03];
    const results = {
        "0.01": { depthShares: 0, depthUSD: 0 },
        "0.02": { depthShares: 0, depthUSD: 0 },
        "0.03": { depthShares: 0, depthUSD: 0 }
    };

    for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const outcome = outcomes[i];
        console.log(`\nProcessing ${outcome} (Token: ${tokenId})`);

        const bookUrl = `https://clob.polymarket.com/book?token_id=${tokenId}`;
        const bookResp = await fetch(bookUrl);
        const orderBook = await bookResp.json();

        const bids = (orderBook.bids || []).map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }));
        const asks = (orderBook.asks || []).map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }));

        const bestBid = bids.length > 0 ? bids[0].price : 0;
        const bestAsk = asks.length > 0 ? asks[0].price : 0;
        const midPrice = (bestBid + bestAsk) / 2;
        console.log(`  Mid Price: ${midPrice.toFixed(4)} (Bid: ${bestBid}, Ask: ${bestAsk})`);

        spreads.forEach(spread => {
            const minBid = midPrice * (1 - spread);
            const maxAsk = midPrice * (1 + spread);

            const validBids = bids.filter(b => b.price >= minBid);
            const validAsks = asks.filter(a => a.price <= maxAsk);

            const dShares = validBids.reduce((acc, o) => acc + o.size, 0) + validAsks.reduce((acc, o) => acc + o.size, 0);
            const dUSD = validBids.reduce((acc, o) => acc + (o.size * o.price), 0) + validAsks.reduce((acc, o) => acc + (o.size * o.price), 0);

            console.log(`  Spread ${spread * 100}%: [${minBid.toFixed(4)}, ${maxAsk.toFixed(4)}]`);
            console.log(`    Valid Orders: ${validBids.length + validAsks.length}`);
            console.log(`    Depth (USD): $${dUSD.toFixed(2)}`);

            results[spread.toString()].depthShares += dShares;
            results[spread.toString()].depthUSD += dUSD;
        });
    }

    console.log("\nTotal Market Depth (Summed):");
    console.log(JSON.stringify(results, null, 2));
}
test();
