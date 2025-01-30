import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Fetch from the external PocketBase URL
        const res = await fetch(`${process.env.POCKETBASE_URL}/api/failedTestsGraphNew`, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error(`Failed to fetch external data (status: ${res.status}).`);
        }

        const data = await res.json();

        // Return the data as JSON
        return NextResponse.json(data);
    } catch (err: any) {
        // In case of error, return a 500
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
