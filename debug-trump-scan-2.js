const slugs = [
    "trump-divorce-in-2025",
    "how-many-people-will-trump-deport-in-2025",
    "will-trump-deport-750000-or-more-people-in-2025",
    "will-trump-extend-tax-cut-on-high-earners",
    "will-trump-cut-corporate-taxes-in-2025",
    "will-trump-acquire-greenland-in-2025",
    "will-trump-be-impeached-in-2025",
    "trump-takes-panama-canal-in-2025",
    "which-countries-will-donald-trump-visit-in-2025",
    "trump-abolishes-the-federal-income-tax-in-2025",
    "will-trump-cut-long-term-capital-gains-tax-in-2025",
    "trump-removed-via-25th-amendment-in-2025",
    "will-trump-resign-in-2025",
    "will-trump-remove-jerome-powell"
];

async function test() {
    // First, search for Ukraine markets
    try {
        const uUrl = `https://gamma-api.polymarket.com/events?limit=20&active=true&closed=false&slug=ukraine`;
        const uResp = await fetch(uUrl);
        const uData = await uResp.json();
        const ukraineEvents = uData.filter(e => e.title.toLowerCase().includes("trump") || e.slug.toLowerCase().includes("trump"));
        ukraineEvents.forEach(e => slugs.push(e.slug));
        console.log(`Added ${ukraineEvents.length} Ukraine-Trump markets.`);
    } catch (e) { }

    for (const slug of slugs) {
        try {
            const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data || data.length === 0) continue;

            const event = data[0];
            const market = event.markets[0];

            let tokenIds = market.clobTokenIds;
            let outcomes = market.outcomes;
            if (typeof tokenIds === 'string') tokenIds = JSON.parse(tokenIds);
            if (typeof outcomes === 'string') outcomes = JSON.parse(outcomes);

            console.log(`\n--- Market: ${market.question} (${slug}) ---`);

            for (let i = 0; i < tokenIds.length; i++) {
                const tokenId = tokenIds[i];
                const outcome = outcomes[i];

                const bookUrl = `https://clob.polymarket.com/book?token_id=${tokenId}`;
                const bookResp = await fetch(bookUrl);
                const orderBook = await bookResp.json();

                const bids = (orderBook.bids || []).map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }));
                const asks = (orderBook.asks || []).map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }));

                const bestBid = bids.length > 0 ? bids[0].price : 0;
                const bestAsk = asks.length > 0 ? asks[0].price : 0;
                const midPrice = (bestBid + bestAsk) / 2;

                const spread = 0.01;
                const minBid = midPrice * (1 - spread);
                const maxAsk = midPrice * (1 + spread);

                const validBids = bids.filter(b => b.price >= minBid);
                const validAsks = asks.filter(a => a.price <= maxAsk);

                const depthShares = validBids.reduce((acc, o) => acc + o.size, 0) + validAsks.reduce((acc, o) => acc + o.size, 0);
                const depthUSD = validBids.reduce((acc, o) => acc + (o.size * o.price), 0) + validAsks.reduce((acc, o) => acc + (o.size * o.price), 0);

                console.log(`  Outcome: ${outcome}`);
                console.log(`    Mid Price: ${midPrice.toFixed(4)}`);
                console.log(`    1% Depth (Shares): ${depthShares.toFixed(0)}`);
                console.log(`    1% Depth (USD): $${depthUSD.toFixed(2)}`);
            }
        } catch (e) { console.log(`Error processing ${slug}:`, e.message); }
    }
}
test();
