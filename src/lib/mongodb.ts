import { MongoClient, Db } from "mongodb";

// MongoDB connection URI (ensure this is defined in your .env.local)
const uri = process.env.MONGODB_URI!;
const options = {}; // MongoDB options (you can extend this if needed)

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Declare a global variable for MongoDB client promise to avoid multiple clients during hot reload
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Ensure the URI is defined
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// Create a MongoClient instance and promise
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global MongoClient promise to avoid creating multiple clients during hot reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, always create a new MongoClient instance
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export the MongoClient promise as default
export default clientPromise;

// Helper function to connect to the database
export const connectToDatabase = async (): Promise<{ client: MongoClient; db: Db }> => {
  const client = await clientPromise; // Wait for the client promise to resolve
  const db = client.db("navo-web-app"); // Use your database name
  return { client, db };
};
