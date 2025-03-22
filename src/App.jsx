import { useEffect, useState } from "react";
import LocationAccess from "./components/location-access";
import { getWeather } from "./lib/api";

const App = () => {
  const [locationData, setLocationData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (locationData) {
      setLoading(true);
      getWeather(locationData?.latitude, locationData?.longitude)
        .then((data) => {
          console.log("Weather data received:", data);
          setWeatherData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching weather:", err);
          setError("Could not fetch weather data");
          setLoading(false);
        });
    }
  }, [locationData]);

  const buttonBottom = () => {
    window.Telegram.WebApp.MainButton.text = "Developed by Asqarbek";
    window.Telegram.WebApp.MainButton.show();
    window.Telegram.WebApp.MainButton.onClick(() => {
      window.Telegram.WebApp.openTelegramLink("https://t.me/asqarb3k");
    });
  };

  return locationData === null ? (
    <LocationAccess setLocationData={setLocationData} />
  ) : loading ? (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading weather data...</div>
    </div>
  ) : error ? (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl text-red-500">{error}</div>
    </div>
  ) : weatherData ? (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center p-6 bg-[#192728] shadow-md rounded-xl border-2 border-white/10">
          <h2 className="text-xl font-bold text-center mb-4">
            Weather in {weatherData.name}, {weatherData.sys?.country || ""}
          </h2>
          <div className="flex items-center justify-center mb-4">
            <img
              src={`https://openweathermap.org/img/wn/${weatherData.weather?.[0]?.icon || "02d"}@4x.png`}
              alt="Weather Icon"
              className="w-20 h-20"
            />
          </div>

          <div>
            <p className="text-4xl font-bold">{weatherData.main?.temp || 0}°C</p>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-300">
              {weatherData.weather?.[0]?.main || "Unknown"},{" "}
              {weatherData.weather?.[0]?.description || "Unknown weather"}
            </p>
          </div>
        </div>
      </div>

      {buttonBottom()}
    </>
  ) : null;
};

export default App;
