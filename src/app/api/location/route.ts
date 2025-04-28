import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb"; // Reusing the helper function from mongodb.ts

// Updated mock location data with provided coordinates
const mockLocationData = { // Center of Singapore
  latitude: 1.3521,
  longitude: 103.8198,
  zoom: 10,
  speedKm: 0.000,
  travelled: 0.000,
  timestamp: new Date().toISOString(),
};

export async function GET() {
  try {
    // Connect to the database and get the location collection
    const { db } = await connectToDatabase();
    const locationCollection = db.collection("location");

    // Find the latest location data
    const latestLocationData = await locationCollection.findOne(
      {},
      { sort: { _id: -1 } }
    );

    if (latestLocationData) {
      return NextResponse.json(latestLocationData, {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } else {
      // Return mock data if no location data is found
      return NextResponse.json(mockLocationData, {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
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
    const {
      latitude,
      longitude,
      zoom,
      speedKm,
      travelled,
      timestamp,
    } = await request.json();

    // Validate incoming data
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof zoom !== "number" ||
      typeof speedKm !== "number" ||
      typeof travelled !== "number" ||
      typeof timestamp !== "number"
    ) {
      console.error("Invalid data format:", {
        latitude,
        longitude,
        zoom,
        speedKm,
        travelled,
        timestamp,
      });
      return NextResponse.json(
        { status: "error", message: "Invalid data format" },
        { status: 400 }
      );
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    const locationCollection = db.collection("location");

    // Calculate the zoom level based on speed
    const calculatedZoom =
      speedKm < 41 ? 16 : speedKm > 40 && speedKm < 81 ? 15 : speedKm > 80 ? 14 : 10;

    const latestLocationData = {
      latitude,
      longitude,
      zoom: calculatedZoom,
      speedKm,
      travelled,
      timestamp,
    };

    // Store the location data in the database
    await locationCollection.insertOne(latestLocationData);

    return NextResponse.json(
      {
        status: "success",
        data: latestLocationData,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error handling POST request:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to handle POST request" },
      { status: 500 }
    );
  }
}
