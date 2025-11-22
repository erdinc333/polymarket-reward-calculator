const slug = "russia-x-ukraine-ceasefire-in-2025";
const marketUrl = `https://gamma-api.polymarket.com/events?slug=${slug}`;

async function test() {
    try {
        const mRes = await fetch(marketUrl);
        const mData = await mRes.json();
        const event = mData[0];
        const market = event.markets[0];

        console.log("Outcomes:", JSON.stringify(market.outcomes, null, 2));
        console.log("clobTokenIds:", JSON.stringify(market.clobTokenIds, null, 2));

    } catch (e) { console.error(e); }
}
test();
