"use client"; // This directive makes this component a Client Component

import MapBoxWidget from "../components/MapBoxWidget";

export default function Location() {
  return (
    <main className="container">
      <MapBoxWidget />
    </main>
  );
}
