const url = `https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false`;

async function test() {
    try {
        console.log(`Fetching events...`);
        const response = await fetch(url);
        const data = await response.json();

        console.log(`Found ${data.length} events.`);

        const muskEvents = data.filter(e => e.title.toLowerCase().includes("musk") || e.slug.toLowerCase().includes("musk"));

        console.log(`Found ${muskEvents.length} Musk events:`);
        muskEvents.forEach(e => {
            console.log(`- Title: ${e.title}`);
            console.log(`  Slug: ${e.slug}`);
        });

    } catch (e) { console.error(e); }
}
test();
