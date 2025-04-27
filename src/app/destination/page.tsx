"use client";

import { useState, useEffect } from "react";

type MapboxResult = {
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  id: string;
};

// Type for destination data
type Destination = {
  _id: string; // Assuming the _id is a string
  latitude: number;
  longitude: number;
  timestamp: string; // ISO string timestamp
};

const mockDestinationData = { // Default Airport Data
  _id: "mock-id",
  latitude: 1.3598904326267722,
  longitude: 103.98974810371432,
  timestamp: new Date().toISOString(),
};

export default function DestinationPage() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapboxResult | null>(null);
  const [loading, setLoading] = useState(false); // Track loading state for search
  const [saving, setSaving] = useState(false); // Track saving state
  const [errorMessage, setErrorMessage] = useState(""); // Track any error message
  const [searchActive, setSearchActive] = useState(false); // Track if a search is active (i.e., avoid rerunning search on selection)

  const fetchDestination = async () => {
    try {
      const response = await fetch("/api/destination");
      const data = await response.json();

      // Check if the destination matches the mock data
      if (
        data.latitude === mockDestinationData.latitude &&
        data.longitude === mockDestinationData.longitude
      ) {
        setDestination(null); // If it matches, set destination to null
      } else {
        setDestination(data); // Otherwise, set the fetched destination
      }
    } catch (error) {
      console.error("Error fetching current destination:", error);
      setErrorMessage("Failed to load current destination.");
    }
  };

  const fetchAllDestinations = async () => {
    try {
      const response = await fetch("/api/destination?all=true");
      const data = await response.json();

      if (
        data.length === 1 &&
        data[0].latitude === mockDestinationData.latitude &&
        data[0].longitude === mockDestinationData.longitude
      ) {
        setAllDestinations([]); // If it matches, set destination to null
      } else {
        setAllDestinations(data); // Otherwise, set the fetched destinations
      }
    } catch (error) {
      console.error("Error fetching all destinations:", error);
      setErrorMessage("Failed to fetch all destinations.");
    }
  };
  
  // Fetch the oldest destination when the page loads
  useEffect(() => {
    fetchDestination();
  }, []);

  // Fetch all destinations sorted from old to new
  useEffect(() => {  
    fetchAllDestinations();
  }, []);

  // Debounced search function to reduce the number of API calls
  useEffect(() => {
    if (searchQuery.length < 3 || searchActive) {
      setSearchResults([]);
      return;
    }

    const debounceSearch = setTimeout(() => {
      fetchSearchResults();
    }, 1000);

    return () => clearTimeout(debounceSearch);
  }, [searchQuery, searchActive]);

  // Fetch search results from Mapbox API
  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();
      setSearchResults(data.features);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setErrorMessage("Failed to fetch search results.");
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setErrorMessage(""); // Clear any error message when typing
    setSearchActive(false); // Reset searchActive when typing
  };

  // Handle result click (user selects a location)
  const handleResultClick = (place: any) => {
    if (!selectedLocation) {
      setSearchQuery(place.place_name);
      setSearchResults([]); // Clear search results when a suggestion is selected
      setSelectedLocation(place); // Set the selected location
      setSearchActive(true); // Set searchActive to true to prevent further API calls
      setErrorMessage(""); // Clear error message when selecting a location
    }
  };

  // Handle save button click
  const handleSave = async () => {
    if (!selectedLocation) return;

    setSaving(true);
    const latitude = selectedLocation.center[1]; // Latitude is at index 1
    const longitude = selectedLocation.center[0]; // Longitude is at index 0
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const response = await fetch("/api/destination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
          timestamp,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchDestination();
        await fetchAllDestinations();

        setSearchQuery(""); // Clear search query after saving
        setSearchResults([]); // Clear search results
        setSelectedLocation(null); // Clear selected location
      } else {
        setErrorMessage("Failed to save new destination.");
      }
    } catch (error) {
      console.error("Error saving destination:", error);
      setErrorMessage("Failed to save new destination.");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete button for individual destination
  const handleDeleteDestination = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/destination?ids=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setAllDestinations(allDestinations.filter(dest => dest._id !== id)); // Remove deleted destination
        setDestination(null); // Clear the destination in the UI
      } else {
        setErrorMessage("Failed to delete destination.");
      }
    } catch (error) {
      console.error("Error deleting destination:", error);
      setErrorMessage("Failed to delete destination.");
    } finally {
      setSaving(false);
    }
  };

  // Handle clear button click to delete all destinations
  const handleClearAll = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/destination", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: allDestinations.map(dest => dest._id), // Pass the IDs of destinations to delete
        }),
      });

      if (response.ok) {
        setAllDestinations([]); // Clear all destinations in the UI
        setDestination(null); // Clear the destination in the UI
        setSearchQuery(""); // Clear search query after clearing
        setSearchResults([]); // Clear search results
      } else {
        setErrorMessage("Failed to clear all destinations.");
      }
    } catch (error) {
      console.error("Error clearing destinations:", error);
      setErrorMessage("Failed to clear all destinations.");
    } finally {
      setSaving(false);
    }
  };

  // Handle clear selected location button click
  const handleClearSelectedLocation = () => {
    setSelectedLocation(null); // Reset selected location
    setSearchQuery(""); // Clear search query
    setSearchResults([]); // Clear search results
    setSearchActive(false); // Allow new search again
  };

  return (
    <div className="destination-page">
      <h1 className="destination-header">Current Destination</h1>

      {destination ? (
        <div className="destination-info">
          <p>Latitude: {destination.latitude}</p>
          <p>Longitude: {destination.longitude}</p>
        </div>
      ) : (
        <p className="no-destination">No current destination</p>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for a location"
          className="search-input"
          disabled={!!selectedLocation}
        />
        <div className="search-results">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="search-result-item"
              >
                {result.place_name}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedLocation && (
        <div className="selected-location">
          <p>Selected Location: {selectedLocation.place_name}</p>
          <p>
            Latitude: {selectedLocation.center[1]}, Longitude: {selectedLocation.center[0]}
          </p>
          <button onClick={handleClearSelectedLocation} className="clear-selected-location-button">
            X
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="button-container">
        <button
          onClick={handleSave}
          className="save-button"
          disabled={!selectedLocation || saving}
        >
          {saving ? "Saving..." : "Save New Destination"}
        </button>
        <button
          onClick={handleClearAll}
          className="clear-button"
          disabled={saving || !allDestinations.length || !destination}
        >
          {saving ? "Clearing..." : "Clear All Destinations"}
        </button>
      </div>

      <div className="destinations-list">
        <h2 className="all-destinations-header">All Destinations</h2>
        {allDestinations.length > 0 ? (
          <ul className="destinations-card-list">
            {allDestinations.map((dest, index) => (
              <li key={dest._id} className="destination-card">
                <div className="destination-card-header">
                  <p className="destination-card-title">Destination {index + 1}</p>
                  <button onClick={() => handleDeleteDestination(dest._id)} className="delete-button">
                    Delete
                  </button>
                </div>
                <p className="destination-card-location">
                  Latitude: {dest.latitude}, Longitude: {dest.longitude}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-destination">No destinations available</p>
        )}
      </div>
    </div>
  );
}
