const slug = "presidential-election-winner-2024";
const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;

async function test() {
    try {
        const response = await fetch(url);
        console.log("Status:", response.status);
        if (!response.ok) {
            console.log("Response not OK");
            return;
        }
        const data = await response.json();
        console.log("Data length:", data.length);
        if (data.length > 0) {
            console.log("First item keys:", Object.keys(data[0]));
            console.log("First item markets:", data[0].markets ? "Yes" : "No");
        } else {
            console.log("Data is empty array");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
