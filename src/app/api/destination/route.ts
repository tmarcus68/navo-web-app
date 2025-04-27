import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const database = client.db("navo-web-app");
const destinationCollection = database.collection("destination");

const mockDestinationData = { // Airport
  _id: "mock-id",
  latitude: 1.3598904326267722,
  longitude: 103.98974810371432,
  timestamp: new Date().toISOString(),
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all");

  try {
    if (all === "true") {
      // Fetch all destinations from the database, sorted by _id (oldest first)
      const allDestinations = await destinationCollection
        .find({}, { sort: { _id: 1 } })
        .toArray();

      // If destinations exist, return them. If not, include mockDestinationData in the array.
      const responseDestinations = allDestinations.length > 0
        ? allDestinations
        : [mockDestinationData];

      return NextResponse.json(responseDestinations, {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } else {
      // Fetch the oldest destination based on the _id field (oldest first)
      const oldestDestinationData = await destinationCollection.findOne(
        {},
        { sort: { _id: 1 } }
      );

      if (oldestDestinationData) {
        return NextResponse.json(oldestDestinationData, {
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
      } else {
        // Return mock data if no destination is found
        return NextResponse.json(mockDestinationData, {
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
      }
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

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids"); // Get ids from query string

    if (idsParam) {
      const ids = idsParam.split(",").map((id) => new ObjectId(id));

      const result = await destinationCollection.deleteMany({
        _id: { $in: ids },
      });

      return NextResponse.json(
        {
          status: "success",
          message: `${result.deletedCount} destination(s) deleted successfully`,
        },
        { status: 200 }
      );
    } else {
      // No ids provided, delete all destinations
      await destinationCollection.deleteMany({});

      return NextResponse.json(
        { status: "success", message: "All destinations cleared successfully" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error clearing destination(s):", error);
    return NextResponse.json(
      { status: "error", message: "Failed to clear destination(s)" },
      { status: 500 }
    );
  }
}
