"use client"; // This directive makes this component a Client Component

import { useEffect, useState } from "react";

// Define the type for location data
type LocationData = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function LocationPage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let lastLocation: LocationData | null = null;

    const fetchLocation = async () => {
      try {
        const response = await fetch("/api/location");
        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }
        const data: LocationData = await response.json();

        // Only update state if location data has changed
        if (
          !lastLocation ||
          lastLocation.latitude !== data.latitude ||
          lastLocation.longitude !== data.longitude ||
          lastLocation.timestamp !== data.timestamp
        ) {
          setLocation(data);
          lastLocation = data;
        }

        // Clear error state if fetch is successful
        if (error) {
          setError(null);
        }
      } catch (err: any) {
        // Set error only if the previous state wasn't an error
        if (!error) {
          setError(
            err.message || "An error occurred while fetching location data"
          );
        }
      }
    };

    fetchLocation(); // Fetch initial data

    // Polling every 60 seconds
    intervalId = setInterval(fetchLocation, 60000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [error]); // Add error to dependency array

  useEffect(() => {
    if (location) {
      console.log("Updated Location:", location);
    }
  }, [location]);

  return (
    <main className="container">
      <h1 className="title">Current Location</h1>
      {error && <p className="error">{error}</p>}
      {location ? (
        <div className="location">
          <p>
            <span className="label">Latitude:</span>{" "}
            <span className="value">{location.latitude}</span>
          </p>
          <p>
            <span className="label">Longitude:</span>{" "}
            <span className="value">{location.longitude}</span>
          </p>
          <p>
            <span className="label">Timestamp:</span>{" "}
            <span className="value">{location.timestamp}</span>
          </p>
        </div>
      ) : (
        <p>No location data available</p>
      )}
    </main>
  );
}
