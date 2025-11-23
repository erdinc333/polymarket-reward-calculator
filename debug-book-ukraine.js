const slug = "russia-x-ukraine-ceasefire-in-2025";

async function test() {
    try {
        const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) return;

        const event = data[0];
        const market = event.markets[0];

        let tokenIds = JSON.parse(market.clobTokenIds);
        let outcomes = JSON.parse(market.outcomes);

        console.log(`\nMarket: ${market.question}`);

        for (let i = 0; i < tokenIds.length; i++) {
            const tokenId = tokenIds[i];
            const outcome = outcomes[i];

            const bookUrl = `https://clob.polymarket.com/book?token_id=${tokenId}`;
            const bookResp = await fetch(bookUrl);
            const orderBook = await bookResp.json();

            // Sort: Bids Descending (Highest to Lowest), Asks Ascending (Lowest to Highest)
            const bids = (orderBook.bids || []).map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) })).sort((a, b) => b.price - a.price);
            const asks = (orderBook.asks || []).map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) })).sort((a, b) => a.price - b.price);

            console.log(`\n=== ${outcome.toUpperCase()} TOKEN ===`);

            console.log(`  BIDS (Orders to BUY ${outcome}):`);
            if (bids.length === 0) console.log("    (No Bids)");
            bids.slice(0, 10).forEach(b => {
                console.log(`    Price: $${b.price.toFixed(2)} | Size: ${b.size.toFixed(0)} | Value: $${(b.price * b.size).toFixed(2)}`);
            });

            console.log(`  ASKS (Orders to SELL ${outcome}):`);
            if (asks.length === 0) console.log("    (No Asks)");
            asks.slice(0, 10).forEach(a => {
                console.log(`    Price: $${a.price.toFixed(2)} | Size: ${a.size.toFixed(0)} | Value: $${(a.price * a.size).toFixed(2)}`);
            });
        }
    } catch (e) { console.log(e); }
}
test();
