"use client"; // This directive makes this component a Client Component

import WeatherWidget from "../components/WeatherWidget";

export default function Weather() {
  return (
    <main className="container">
      <WeatherWidget />
    </main>
  );
}
