import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch location data from the location API
    const locationResponse = await fetch(`${process.env.DOMAIN}/api/location`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (!locationResponse.ok) {
      throw new Error(`Failed to fetch location data: ${locationResponse.statusText}`);
    }

    const locationData = await locationResponse.json();

    if (!locationData.latitude || !locationData.longitude) {
      throw new Error("Invalid location data: Missing latitude or longitude");
    }

    // Construct the weather API URL
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${locationData.latitude}&lon=${locationData.longitude}&exclude=minutely,hourly,daily,alerts&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}&_=${new Date().getTime()}`;

    // Fetch weather data from OpenWeatherMap API
    const response = await fetch(weatherUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const weatherData = await response.json();

    return NextResponse.json(weatherData, {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message ?? "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
