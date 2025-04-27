import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const database = client.db("navo-web-app");
const destinationCollection = database.collection("destination");

const mockDestinationData = { // Airport
  latitude: 1.3598904326267722,
  longitude: 103.98974810371432,
  timestamp: new Date().toISOString(),
};

export async function GET() {
  try {
    const latestDestinationData = await destinationCollection.findOne(
      {},
      { sort: { _id: -1 } }
    );

    if (latestDestinationData) {
      return NextResponse.json(latestDestinationData, {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } else {
      return NextResponse.json(mockDestinationData, {
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

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof timestamp !== "number"
    ) {
      console.error("Invalid data format:", { latitude, longitude, timestamp });
      return NextResponse.json(
        { status: "error", message: "Invalid data format" },
        { status: 400 }
      );
    }

    // Clear existing destination data from the database before inserting the new one
    await destinationCollection.deleteMany({}); // Deletes all documents in the destination collection

    const newDestinationData = { latitude, longitude, timestamp };

    await destinationCollection.insertOne(newDestinationData);

    return NextResponse.json(
      {
        status: "success",
        data: newDestinationData,
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

export async function DELETE() {
  try {
    await destinationCollection.deleteMany({});

    return NextResponse.json(
      { status: "success", message: "Destination cleared successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing destination:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to clear destination" },
      { status: 500 }
    );
  }
}