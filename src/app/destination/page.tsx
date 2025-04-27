"use client"; 

import { useState, useEffect } from "react";

// Type for destination data
type Destination = {
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp
};

const mockDestinationData = { // Default Airport Data
  latitude: 1.3598904326267722,
  longitude: 103.98974810371432,
  timestamp: new Date().toISOString(),
};

export default function DestinationPage() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null); // Track the selected location
  const [loading, setLoading] = useState(false); // Track loading state for search
  const [saving, setSaving] = useState(false); // Track saving state
  const [errorMessage, setErrorMessage] = useState(""); // Track any error message
  const [searchActive, setSearchActive] = useState(false); // Track if a search is active (i.e., avoid rerunning search on selection)

  // Fetch the current destination when the page loads
  useEffect(() => {
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

    fetchDestination();
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
    setSearchQuery(place.place_name);
    setSearchResults([]); // Clear search results when a suggestion is selected
    setSelectedLocation(place); // Set the selected location
    setSearchActive(true); // Set searchActive to true to prevent further API calls
    setErrorMessage(""); // Clear error message when selecting a location
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
        setDestination(data.data); // Update destination state with new data
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

  // Handle clear button click
  const handleClear = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/destination", {
        method: "DELETE",
      });

      if (response.ok) {
        setDestination(null); // Clear the destination in the UI
        setSearchQuery(""); // Clear search query after clearing
        setSearchResults([]); // Clear search results
      } else {
        setErrorMessage("Failed to clear destination.");
      }
    } catch (error) {
      console.error("Error clearing destination:", error);
      setErrorMessage("Failed to clear destination.");
    } finally {
      setSaving(false);
    }
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
        <p className="no-destination">No destination saved</p>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for a location"
          className="search-input"
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
          onClick={handleClear}
          className="clear-button"
          disabled={!destination || saving}
        >
          {saving ? "Clearing..." : "Clear Destination"}
        </button>
      </div>
    </div>
  );
}
