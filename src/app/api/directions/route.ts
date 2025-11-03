import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store (IP → last request time)
const requestTimestamps = new Map<string, number>();

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const lastRequestTime = requestTimestamps.get(ip) || 0;

    // 30-second window (in ms)
    const THROTTLE_INTERVAL = 30 * 1000;

    if (now - lastRequestTime < THROTTLE_INTERVAL) {
      const wait = Math.ceil((THROTTLE_INTERVAL - (now - lastRequestTime)) / 1000);
      return NextResponse.json(
        { status: "error", message: `Rate limit exceeded. Try again in ${wait}s.` },
        { status: 429 }
      );
    }

    // Store timestamp of this request
    requestTimestamps.set(ip, now);

    const { searchParams } = new URL(req.url);

    const defaultOrigin = { // Jurong Point
      latitude: 1.339942727844487,
      longitude: 103.7067511531337
    };

    const defaultDestination = { // Airport
      latitude: 1.3598904326267722,
      longitude: 103.98974810371432
    };

    // Parse latitude and longitude from search params or use defaults
    const originLatitude = parseFloat(searchParams.get("originLatitude") ?? "") || defaultOrigin.latitude;
    const originLongitude = parseFloat(searchParams.get("originLongitude") ?? "") || defaultOrigin.longitude;
    const destinationLatitude = parseFloat(searchParams.get("destinationLatitude") ?? "") || defaultDestination.latitude;
    const destinationLongitude = parseFloat(searchParams.get("destinationLongitude") ?? "") || defaultDestination.longitude;

    const origin = { latitude: originLatitude, longitude: originLongitude };
    const destination = { latitude: destinationLatitude, longitude: destinationLongitude };

    // Construct the Mapbox Directions API URL
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

    // Fetch the directions from Mapbox
    const directionsResponse = await fetch(directionsUrl);

    if (!directionsResponse.ok) {
      throw new Error(`Failed to fetch directions: ${directionsResponse.statusText}`);
    }

    const directionsData = await directionsResponse.json();

    // Extract the route from the Mapbox response
    const route = directionsData.routes?.[0]?.geometry;
    if (!route) {
      throw new Error("No route found in the response");
    }

    // Return the response with the route data
    return NextResponse.json(
      { origin, destination, route },
      {
        headers: {
          "Cache-Control": "no-store",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error handling directions request:", error);

    // Provide a detailed error response
    return NextResponse.json(
      { status: "error", message: (error as Error).message ?? "Failed to fetch directions" },
      { status: 500 }
    );
  }
}
