"use client"; // This directive makes this component a Client Component

import { useEffect, useState } from "react";
import Map from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type LocationData = {
  latitude: number;
  longitude: number;
};

export default function MapBoxWidget() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch("/api/location");
        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }
        const data: LocationData = await response.json();
        setLocation(data);
        setError(null); // Clear error if fetch is successful
      } catch (err: any) {
        setError(
          err.message || "An error occurred while fetching location data"
        );
      }
    };

    fetchLocation();
  }, []);

  return (
    <div className="map-widget">
      {error && <p className="error">{error}</p>}
      {location ? (
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          initialViewState={{
            latitude: location.latitude,
            longitude: location.longitude,
            zoom: 16,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v9"
        />
      ) : (
        <p>Loading map...</p>
      )}
    </div>
  );
}
