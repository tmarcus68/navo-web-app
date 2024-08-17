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
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${locationData.latitude}&lon=${locationData.longitude}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();
    console.log(data.main.temp);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
