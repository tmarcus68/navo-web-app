import { NextRequest, NextResponse } from "next/server";

let latestLocationData: {
  latitude: number;
  longitude: number;
  timestamp: string;
} | null = null;

export async function GET() {
  try {
    if (latestLocationData) {
      return NextResponse.json(latestLocationData);
    } else {
      return NextResponse.json(
        { error: "No location data available" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error handling GET request:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to handle GET request" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, timestamp } = await request.json();

    // Validate incoming data
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof timestamp !== "string"
    ) {
      console.error("Invalid data format:", { latitude, longitude, timestamp });
      return NextResponse.json(
        { status: "error", message: "Invalid data format" },
        { status: 400 }
      );
    }

    // Store the location data
    console.log("Received location data:", { latitude, longitude, timestamp });
    latestLocationData = { latitude, longitude, timestamp };

    return NextResponse.json({
      status: "success",
      data: { latitude, longitude, timestamp },
    });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to handle POST request" },
      { status: 500 }
    );
  }
}
