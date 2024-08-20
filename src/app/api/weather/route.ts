import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch location data from your location API route
    const locationResponse = await fetch(`${process.env.DOMAIN}/api/location`, {
      headers: {
        "Cache-Control": "no-store", // Ensure we get fresh data
      },
    });

    if (!locationResponse.ok) {
      throw new Error("Failed to fetch location data");
    }

    const locationData = await locationResponse.json();
    console.log("Weather API, locationData: ", locationData);

    if (!locationData.latitude || !locationData.longitude) {
      throw new Error("Invalid location data");
    }

    // Construct the weather API URL
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${
      locationData.latitude
    }&lon=${
      locationData.longitude
    }&exclude=minutely,hourly,daily,alerts&units=metric&appid=${
      process.env.OPENWEATHERMAP_API_KEY
    }&_=${new Date().getTime()}`;

    // Fetch weather data from OpenWeatherMap API using the location data
    const response = await fetch(weatherUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();

    console.log("Weather API, weather data: ", data); // Debug log

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
