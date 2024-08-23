"use client"; // This directive makes this component a Client Component

import { useEffect, useState } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type ViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export default function MapBoxWidget() {
  const [viewState, setViewState] = useState<ViewState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch("/api/location");
        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }
        const data: ViewState = await response.json(); // Fetch the location and treat it as viewState

        setViewState({ ...data }); // Set viewState with location
        setError(null); // Clear error if fetch is successful
      } catch (err: any) {
        setError(
          err.message || "An error occurred while fetching location data"
        );
      }
    };

    fetchLocation();

    // Poll location data every minute
    const intervalId = setInterval(fetchLocation, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="map-widget">
      <div className="map-content">
        {error && !viewState && <p className="error">{error}</p>}
        {viewState ? (
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            {/* Add custom marker */}
            <Marker
              latitude={viewState.latitude}
              longitude={viewState.longitude}
              anchor="center"
            >
              <img
                src="/jiuerxiong-logo.png"
                alt="Custom Marker"
                style={{ width: 50, height: 50 }}
              />
            </Marker>
          </Map>
        ) : (
          <p>Loading map...</p>
        )}
      </div>
    </div>
  );
}
