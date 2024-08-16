import { useEffect, useState } from "react";

type WeatherData = {
  main: {
    temp: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch("/api/weather");
        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }
        const data: WeatherData = await response.json();
        setWeather(data);
        if (error) setError(null); // Clear error if fetch is successful
      } catch (err: any) {
        if (!error)
          setError(
            err.message || "An error occurred while fetching weather data"
          );
      }
    };

    fetchWeather();
  }, [error]);

  return (
    <div className="weather-widget">
      <div className="widget-content">
        {error && <p className="error">{error}</p>}
        {weather ? (
          <div className="weather-info">
            <p className="temperature">{weather.main.temp.toFixed(1)}°C</p>
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`}
              alt={weather.weather[0].description}
              className="weather-icon"
            />
            <p className="weather-main">{weather.weather[0].main}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
