const slug = "russia-x-ukraine-ceasefire-in-2025";
const marketUrl = `https://gamma-api.polymarket.com/events?slug=${slug}`;

async function test() {
    console.log("1. Fetching Market...");
    try {
        const mRes = await fetch(marketUrl);
        const mData = await mRes.json();

        if (!mData || mData.length === 0) {
            console.log("Market data empty");
            return;
        }

        const event = mData[0];
        const markets = event.markets || [];
        console.log(`Found ${markets.length} markets`);

        for (const market of markets) {
            console.log(`Processing market: ${market.question}`);
            const tokenIds = market.clobTokenIds || [];
            console.log(`Token IDs: ${tokenIds.length}`);

            if (tokenIds.length > 0) {
                const tokenId = tokenIds[0];
                console.log(`2. Fetching Orderbook for ${tokenId}...`);

                const bookUrl = `https://clob.polymarket.com/book?token_id=${tokenId}`;
                const bRes = await fetch(bookUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    }
                });

                if (!bRes.ok) {
                    console.log(`Orderbook fetch failed: ${bRes.status}`);
                    const text = await bRes.text();
                    console.log(`Response: ${text}`);
                } else {
                    const book = await bRes.json();
                    console.log("Orderbook fetched successfully");
                    console.log(`Bids: ${book.bids?.length}, Asks: ${book.asks?.length}`);
                }
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

test();
