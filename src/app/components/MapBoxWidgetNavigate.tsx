"use client"; // This directive makes this component a Client Component

import { useEffect, useState, useRef } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapRef } from "react-map-gl"; // For controlling map programmatically

type ViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export default function MapBoxWidgetNavigate() {
  const [viewState, setViewState] = useState<ViewState | null>(null); // location
  const [lastLocation, setLastLocation] = useState<ViewState | null>(null);
  const [destination, setDestination] = useState<ViewState | null>(null); // Track destination in state
  const [route, setRoute] = useState<any>(null); // State for route data
  const mapRef = useRef<MapRef>(null); // Ref to control the map
  const [error, setError] = useState<string | null>(null);

  // Fetch destination from API
  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const response = await fetch("/api/destination"); // Replace with your actual API endpoint
        if (!response.ok) throw new Error("Failed to fetch destination");
        const data: ViewState = await response.json();
        setDestination(data); // Set destination from API response
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching destination");
      }
    };

    fetchDestination(); // Fetch destination once when the component mounts
  }, []);

  // Fetch location data from API and update the map
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch("/api/location");
        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }
        const data: ViewState = await response.json();

        // Fetch location only if it's different from the last one
        if (!lastLocation || hasLocationChanged(data, lastLocation)) {
          setViewState({ ...data });
          setLastLocation(data); // Update last location

          // Fetch the route after fetching the location, based on the updated destination
          if (destination) {
            fetchRoute(data.latitude, data.longitude, destination.latitude, destination.longitude);
          }
        }

        // Fit bounds of map to include both origin and destination
        if (mapRef.current && destination) {
          const bounds: [[number, number], [number, number]] = [
            [Math.min(data.longitude, destination.longitude), Math.min(data.latitude, destination.latitude)],
            [Math.max(data.longitude, destination.longitude), Math.max(data.latitude, destination.latitude)],
          ];
          mapRef.current.fitBounds(bounds, { padding: 60, duration: 1000 });
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching location data");
      }
    };

    fetchLocation();

    // Poll location data every 5 seconds
    const intervalId = setInterval(fetchLocation, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId); // Clean up on unmount
  }, [lastLocation, destination]); // Re-run when either location or destination changes

  const hasLocationChanged = (newLocation: ViewState, oldLocation: ViewState) => {
    const distanceThreshold = 0.001; // Distance threshold (adjust as needed)
    const distance = Math.sqrt(
      Math.pow(newLocation.latitude - oldLocation.latitude, 2) + Math.pow(newLocation.longitude - oldLocation.longitude, 2)
    );
    return distance > distanceThreshold;
  };

  const fetchRoute = async (
    originLatitude?: number,
    originLongitude?: number,
    destinationLatitude?: number,
    destinationLongitude?: number
  ) => {
    const params = new URLSearchParams();
  
    if (originLatitude !== undefined && originLongitude !== undefined) {
      params.append("originLatitude", originLatitude.toString());
      params.append("originLongitude", originLongitude.toString());
    }
  
    if (destinationLatitude !== undefined && destinationLongitude !== undefined) {
      params.append("destinationLatitude", destinationLatitude.toString());
      params.append("destinationLongitude", destinationLongitude.toString());
    }
  
    const url = params.toString()
      ? `/api/directions?${params.toString()}`
      : `/api/directions`;
  
    try {
      const directionsResponse = await fetch(url);
      const directionsData = await directionsResponse.json();
      const decodedRoute = directionsData.route?.coordinates || [];
  
      if (decodedRoute.length > 0) {
        setRoute({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: decodedRoute,
          },
        });
      } else {
        setError("No route found.");
      }
    } catch (err) {
      setError("Failed to fetch route.");
    }
  };
  
  return (
    <div className="map-full-widget">
      <div className="map-content">
        {error && !viewState && <p className="error">{error}</p>}
        {!viewState ? (
          <p>Loading map...</p>
        ) : (
          <Map
            ref={mapRef}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            initialViewState={{
              latitude: viewState.latitude,
              longitude: viewState.longitude,
              zoom: 14,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            {/* Current Location Marker */}
            <Marker latitude={viewState.latitude} longitude={viewState.longitude} anchor="center">
              <img src="/jiuerxiong-logo.png" alt="Current Location" style={{ width: 50, height: 50 }} />
            </Marker>

            {/* Destination Marker */}
            {destination && (
              <Marker latitude={destination.latitude} longitude={destination.longitude} anchor="center">
                <img src="/qingyou-logo.png" alt="Destination" style={{ width: 50, height: 50 }} />
              </Marker>
            )}

            {/* Path Line */}
            {route && (
              <Source id="route" type="geojson" data={route}>
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    "line-color": "#007AFF", // Blue path color
                    "line-width": 4, // Solid line with a width of 4px
                    // No line-dasharray to make it solid
                  }}
                />
              </Source>
            )}
          </Map>
        )}
      </div>
    </div>
  );
}
