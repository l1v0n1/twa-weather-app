import axios from "axios";

const Url =
  'http://api.weatherstack.com/current?access_key=a4526f4e34340020b34865e2cc70d5d9&query="';

const fetchData = async (cityName) => {
  const res = await axios.get(`${Url + cityName}`);
  return res.data;
};

export const getWeather = async (latitude, longitude) => {
  // Use coordinates to fetch location data first
  // Then use the city name with weatherstack API
  // As weatherstack uses query parameter with city name instead of coordinates
  const geoResponse = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  );
  const geoData = await geoResponse.json();
  const cityName = geoData.city || geoData.locality || "Unknown";
  
  // Use the fetchData function with the city name
  const data = await fetchData(cityName);
  
  // Transform the data to match the format expected by the app
  return {
    name: data.location.name,
    sys: { 
      country: data.location.country 
    },
    weather: [
      {
        main: data.current.weather_descriptions[0],
        description: data.current.weather_descriptions[0],
        icon: mapWeatherCodeToIcon(data.current.weather_code)
      }
    ],
    main: {
      temp: data.current.temperature
    }
  };
};

// Helper function to map weatherstack weather codes to OpenWeatherMap-like icons
const mapWeatherCodeToIcon = (code) => {
  // This is a simple mapping, you might want to improve it
  if (code >= 200 && code < 300) return "11d"; // thunderstorm
  if (code >= 300 && code < 400) return "09d"; // drizzle
  if (code >= 500 && code < 600) return "10d"; // rain
  if (code >= 600 && code < 700) return "13d"; // snow
  if (code >= 700 && code < 800) return "50d"; // atmosphere
  if (code === 800) return "01d"; // clear
  if (code > 800) return "02d"; // clouds
  return "01d"; // default to clear
}
