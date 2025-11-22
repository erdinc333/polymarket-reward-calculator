import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('token_id');

    if (!tokenId) {
        return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://clob.polymarket.com/book?token_id=${tokenId}`);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch order book' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
