import { useEffect, useState } from "react";

type WeatherData = {
  current: {
    temp: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
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
        setError(null); // Clear error if fetch is successful
      } catch (err: any) {
        setError(
          err.message || "An error occurred while fetching weather data"
        );
      }
    };

    fetchWeather();

    // Poll weather data every minute
    const intervalId = setInterval(fetchWeather, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="weather-widget">
      <div className="widget-content">
        {error && <p className="error">{error}</p>}
        {weather ? (
          <div className="weather-info">
            <p className="temperature">{weather.current.temp.toFixed(1)}°C</p>
            <img
              src={`https://openweathermap.org/img/wn/${weather.current.weather[0].icon}.png`}
              alt={weather.current.weather[0].description}
              className="weather-icon"
            />
            <p className="weather-main">{weather.current.weather[0].main}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
