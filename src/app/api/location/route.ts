import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const database = client.db("navo-web-app");
const locationCollection = database.collection("location");

// Updated mock location data with provided coordinates
const mockLocationData = {
  latitude: 1.3521,
  longitude: 103.8198,
  timestamp: new Date().toISOString(),
};

export async function GET() {
  try {
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

    // Store the location data in MongoDB
    const latestLocationData = { latitude, longitude, timestamp };
    await locationCollection.insertOne(latestLocationData);

    return NextResponse.json(
      {
        status: "success",
        data: { latitude, longitude, timestamp },
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
