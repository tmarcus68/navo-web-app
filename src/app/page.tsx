"use client"; // This directive makes this component a Client Component

import Head from "next/head";

import WeatherWidget from "./components/WeatherWidget";
import MapBoxWidget from "./components/MapBoxWidget";
import MapBoxWidgetNavigation from "./components/MapBoxWidgetNavigation";

export default function Home() {
  return (
    <main className="container">        
      <WeatherWidget />
      <MapBoxWidget />
      <MapBoxWidgetNavigation />
    </main>
  );
}
