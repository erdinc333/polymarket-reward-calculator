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
            console.log("Event ID:", event.id);
            if (event.markets && Array.isArray(event.markets)) {
                console.log("Markets count:", event.markets.length);
                event.markets.forEach((m, i) => {
                    console.log(`Market ${i} keys:`, Object.keys(m));
                    console.log(`Market ${i} tokens:`, m.tokens);
                    console.log(`Market ${i} clobTokenIds:`, m.clobTokenIds);
                });
            } else {
                console.log("No markets array in event");
            }
        } else {
            console.log("Data is empty array");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
