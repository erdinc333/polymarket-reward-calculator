const slug = "will-elon-musk-be-times-person-of-the-year-for-2025"; // Guessing slug
const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;

async function test() {
    try {
        console.log(`Fetching event: ${url}`);
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) {
            console.log("Event not found with guessed slug. Trying search...");
            // Fallback or manual check needed if this fails
            return;
        }

        const event = data[0];
        const market = event.markets[0];
        console.log("Market:", market.question);

        const tokenIds = JSON.parse(market.clobTokenIds);
        const outcomes = JSON.parse(market.outcomes);

        // Check Yes token
        const yesIndex = 0; // Assuming 0 is Yes, need to check
        const tokenId = tokenIds[yesIndex];
        console.log(`Checking Token: ${tokenId} (${outcomes[yesIndex]})`);

        const bookUrl = `https://clob.polymarket.com/book?token_id=${tokenId}`;
        console.log(`Fetching book: ${bookUrl}`);
        const bookResp = await fetch(bookUrl);
        const orderBook = await bookResp.json();

        const bids = (orderBook.bids || []).map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }));
        const asks = (orderBook.asks || []).map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }));

        console.log(`Bids: ${bids.length}, Asks: ${asks.length}`);
        if (bids.length > 0) console.log("Top Bid:", bids[0]);
        if (asks.length > 0) console.log("Top Ask:", asks[0]);

        const bestBid = bids.length > 0 ? bids[0].price : 0;
        const bestAsk = asks.length > 0 ? asks[0].price : 0;
        const midPrice = (bestBid + bestAsk) / 2;
        console.log("Mid Price:", midPrice);

        const spreads = [0.01, 0.02, 0.03];

        spreads.forEach(spread => {
            const minBid = midPrice * (1 - spread);
            const maxAsk = midPrice * (1 + spread);

            const validBids = bids.filter(b => b.price >= minBid);
            const validAsks = asks.filter(a => a.price <= maxAsk);

            // Summing size (shares)
            const depthShares = validBids.reduce((acc, o) => acc + o.size, 0) + validAsks.reduce((acc, o) => acc + o.size, 0);

            // Summing value (USD)
            const depthUSD = validBids.reduce((acc, o) => acc + (o.size * o.price), 0) + validAsks.reduce((acc, o) => acc + (o.size * o.price), 0);

            console.log(`Spread ${spread * 100}%: [${minBid.toFixed(4)}, ${maxAsk.toFixed(4)}]`);
            console.log(`  Valid Bids: ${validBids.length}, Valid Asks: ${validAsks.length}`);
            console.log(`  Depth (Shares): ${depthShares.toFixed(2)}`);
            console.log(`  Depth (USD): $${depthUSD.toFixed(2)}`);
        });

    } catch (e) { console.error(e); }
}
test();
