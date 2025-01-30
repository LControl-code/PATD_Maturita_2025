import { NextResponse } from 'next/server';

// Optional: Export runtime if you need Node features like 'fs',
// or if you want Edge runtime, etc.
// export const runtime = 'nodejs';

// Optional: You can export a default revalidate time if you want
// Next.js to re-fetch automatically after some seconds
// export const revalidate = 60; // 1 minute, for example

export async function GET() {
    try {
        // Fetch from the external PocketBase URL
        const res = await fetch(`${process.env.POCKETBASE_URL}/api/topFailsNew`, { cache: 'no-store' });

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
