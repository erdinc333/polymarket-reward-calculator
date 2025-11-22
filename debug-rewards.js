const slug = "russia-x-ukraine-ceasefire-in-2025";
const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;

async function test() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log("Response not OK");
            return;
        }
        const data = await response.json();
        if (data.length > 0) {
            const event = data[0];
            if (event.markets && Array.isArray(event.markets)) {
                event.markets.forEach((m, i) => {
                    console.log(`Market ${i} Question:`, m.question);
                    console.log(`Market ${i} clobRewards:`, JSON.stringify(m.clobRewards, null, 2));
                    console.log(`Market ${i} rewardsMinSize:`, m.rewardsMinSize);
                    console.log(`Market ${i} rewardsMaxSpread:`, m.rewardsMaxSpread);
                    console.log(`Market ${i} rewards:`, JSON.stringify(m.rewards, null, 2));
                });
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
