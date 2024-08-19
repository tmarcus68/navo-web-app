import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch location data from your location API route
    const locationResponse = await fetch(`${process.env.DOMAIN}/api/location`);
    if (!locationResponse.ok) {
      throw new Error("Failed to fetch location data");
    }
    const locationData = await locationResponse.json();

    if (!locationData.latitude || !locationData.longitude) {
      throw new Error("Invalid location data");
    }

    // Fetch weather data from OpenWeatherMap API using the location data
    // https://openweathermap.org/api/one-call-3#current
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${locationData.latitude}&lon=${locationData.longitude}&exclude=minutely,hourly,daily,alerts&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}`,
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();

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
