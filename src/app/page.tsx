"use client"; // This directive makes this component a Client Component

import WeatherWidget from "./components/WeatherWidget";
import MapBoxWidget from "./components/MapBoxWidget";

export default function Home() {
  return (
    <main className="container">
      <WeatherWidget />
      <MapBoxWidget />
    </main>
  );
}
