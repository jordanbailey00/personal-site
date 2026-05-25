import { NextRequest, NextResponse } from "next/server";
import { getBestNasaImageUrl } from "@/lib/nasa";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const nasaId = searchParams.get("nasaId");

    if (!nasaId) {
        return NextResponse.json({ error: "nasaId is required" }, { status: 400 });
    }

    try {
        const url = await getBestNasaImageUrl(nasaId);
        return NextResponse.json({ url });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
    }
}
