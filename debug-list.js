const url = `https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false`;

async function test() {
    try {
        console.log(`Fetching events...`);
        const response = await fetch(url);
        const data = await response.json();

        console.log(`Found ${data.length} events.`);

        const trumpEvents = data.filter(e => e.title.toLowerCase().includes("trump") || e.slug.toLowerCase().includes("trump"));

        console.log(`Found ${trumpEvents.length} Trump events:`);
        trumpEvents.forEach(e => {
            console.log(`- Title: ${e.title}`);
            console.log(`  Slug: ${e.slug}`);
        });

    } catch (e) { console.error(e); }
}
test();
