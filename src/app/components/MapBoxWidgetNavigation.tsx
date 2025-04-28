import { useEffect, useState, useRef, useCallback } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type ViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
};

type GeoJSONRoute = {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const isOffRoute = (currentLocation: ViewState, routeCoordinates: [number, number][]) => {
  const thresholdMeters = 30;
  return routeCoordinates.every(([lng, lat]) =>
    haversineDistance(currentLocation.latitude, currentLocation.longitude, lat, lng) > thresholdMeters
  );
};

const hasLocationChanged = (newLoc: ViewState, oldLoc: ViewState) => {
  const threshold = 0.001;
  const distance = Math.sqrt(
    (newLoc.latitude - oldLoc.latitude) ** 2 +
    (newLoc.longitude - oldLoc.longitude) ** 2
  );
  return distance > threshold;
};

export default function MapBoxWidgetNavigation() {
  const [viewState, setViewState] = useState<ViewState | null>(null);
  const [lastLocation, setLastLocation] = useState<ViewState | null>(null);
  const [destination, setDestination] = useState<ViewState | null>(null);
  const [previousDestination, setPreviousDestination] = useState<ViewState | null>(null);
  const [route, setRoute] = useState<GeoJSONRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<MapRef>(null);
  const fitBoundsTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchRoute = useCallback(async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ) => {
    const params = new URLSearchParams({
      originLatitude: originLat.toString(),
      originLongitude: originLng.toString(),
      destinationLatitude: destLat.toString(),
      destinationLongitude: destLng.toString(),
    });

    try {
      const res = await fetch(`/api/directions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch route");

      const directionsData = await res.json();
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
        setError("No route found");
      }
    } catch (err) {
      setError("Failed to fetch route");
    }
  }, []);

  const debounceFitBounds = useCallback((location: ViewState, dest: ViewState, route?: GeoJSONRoute) => {
    if (fitBoundsTimeout.current) clearTimeout(fitBoundsTimeout.current);

    fitBoundsTimeout.current = setTimeout(() => {
      if (!mapRef.current) return;

      const bounds = calculateBounds(location, dest, route?.geometry.coordinates || []);
      mapRef.current.fitBounds(bounds, { padding: 60, duration: 1000 });
    }, 300);
  }, []);

  const calculateBounds = (loc: ViewState, dest: ViewState, routeCoords: [number, number][]) => {
    const allCoords = [
      [loc.longitude, loc.latitude],
      [dest.longitude, dest.latitude],
      ...routeCoords,
    ];

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    for (const [lng, lat] of allCoords) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }

    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ] as [[number, number], [number, number]];
  };

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const response = await fetch("/api/destination");
        if (!response.ok) throw new Error("Failed to fetch destination");
        const data: ViewState = await response.json();

        if (!destination || !isSameDestination(data, destination)) {
          setDestination(data);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching destination");
      }
    };

    fetchDestination();

    const intervalId = setInterval(fetchDestination, 5000);
    return () => clearInterval(intervalId);
  }, [destination]);

  const isSameDestination = (newDest: ViewState, oldDest: ViewState | null) => {
    if (!oldDest) return false;
    return newDest.latitude === oldDest.latitude && newDest.longitude === oldDest.longitude;
  };

  useEffect(() => {
    if (destination && !isSameDestination(destination, previousDestination)) {
      setPreviousDestination(destination);
      if (viewState) {
        fetchRoute(viewState.latitude, viewState.longitude, destination.latitude, destination.longitude);
      }
    }
  }, [destination, viewState, previousDestination, fetchRoute]);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("/api/location");
        if (!res.ok) throw new Error("Failed to fetch location");

        const data: ViewState = await res.json();

        if (!lastLocation || hasLocationChanged(data, lastLocation)) {
          setViewState(data);
          setLastLocation(data);

          if (destination) {
            fetchRoute(data.latitude, data.longitude, destination.latitude, destination.longitude);
          }
        }

        if (mapRef.current && destination && route) {
          if (isOffRoute(data, route.geometry.coordinates)) {
            await fetchRoute(data.latitude, data.longitude, destination.latitude, destination.longitude);
          }
          debounceFitBounds(data, destination, route);
        }
      } catch (err: any) {
        setError(err.message || "Error fetching location");
      }
    };

    fetchLocation();
    const intervalId = setInterval(fetchLocation, 5000);
    return () => clearInterval(intervalId);
  }, [lastLocation, destination, route, fetchRoute, debounceFitBounds]);

  if (!viewState || !route || !destination) {
    return (
      <div className="map-full-widget">
        <div className="map-content">
          <p>Loading navigation map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-full-widget">
      <div className="map-content">
        {error && <p className="error">{error}</p>}
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
          <Marker latitude={viewState.latitude} longitude={viewState.longitude} anchor="center">
            <img src="/jiuerxiong-logo.png" alt="Current Location" style={{ width: 50, height: 50 }} />
          </Marker>

          <Marker latitude={destination.latitude} longitude={destination.longitude} anchor="bottom">
            <img src="/destination-icon.png" alt="Destination" style={{ width: 50, height: 50 }} />
          </Marker>

          {route && (
            <Source id="route" type="geojson" data={route}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  "line-color": "#007AFF",
                  "line-width": 4,
                }}
              />
            </Source>
          )}
        </Map>
      </div>
    </div>
  );
}
