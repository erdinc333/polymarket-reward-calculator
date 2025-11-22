import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch market data' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
