const slug = "will-mrbeasts-next-video-get-less-than-25-million-views-on-day-1-462";
const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;

async function test() {
    try {
        console.log(`Fetching ${url}...`);
        const response = await fetch(url);
        const data = await response.json();
        console.log("Data received, length:", data.length);

        if (data.length > 0) {
            const event = data[0];
            console.log("Event Title:", event.title);
            console.log("Markets Count:", event.markets?.length);

            if (event.markets) {
                event.markets.forEach((m, i) => {
                    console.log(`\nMarket ${i}: ${m.question}`);
                    console.log(`Outcomes:`, m.outcomes);
                    console.log(`Outcome Prices:`, m.outcomePrices);
                    console.log(`Token IDs:`, m.clobTokenIds);
                    console.log(`Rewards:`, JSON.stringify(m.clobRewards));
                });
            }
        }
    } catch (e) { console.error(e); }
}
test();
