import { NextRequest, NextResponse } from "next/server";
import { getJwstGalleryPhotos } from "@/lib/jwst";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Number(searchParams.get("limit") ?? 48);

        const photos = await getJwstGalleryPhotos({ limit });

        return NextResponse.json({
            source: "JWST API",
            attribution: "JWST data/products sourced from the JWST API, using observations from the NASA/ESA/CSA James Webb Space Telescope and MAST/STScI. This project uses a third-party JWST API and is not affiliated with NASA, ESA, CSA, STScI, or MAST.",
            count: photos.length,
            photos,
        });
    } catch (error) {
        console.error("Failed to fetch JWST images:", error);
        return NextResponse.json(
            { error: "Failed to fetch JWST images" },
            { status: 500 }
        );
    }
}
