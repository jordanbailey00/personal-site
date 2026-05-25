import { NextResponse } from "next/server";
import { getJwstGalleryPhotos } from "@/lib/jwst";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
    try {
        const photos = await getJwstGalleryPhotos({ limit: 50 });

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
