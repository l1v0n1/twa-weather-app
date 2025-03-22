import axios from "axios";

// There are a few options to handle the HTTP vs HTTPS issue:
// 1. Use a CORS proxy (used here)
// 2. Use a serverless function on Vercel that makes the HTTP request
// 3. Use an alternative API that supports HTTPS

// Option 1: Using a public CORS proxy
// Note: For production, consider setting up your own proxy or serverless function
const proxyUrl = "https://corsproxy.io/?";
const weatherstackUrl = 'http://api.weatherstack.com/current';
const apiKey = 'a4526f4e34340020b34865e2cc70d5d9';

const fetchData = async (cityName) => {
  try {
    // Use the proxy to make the request
    const fullUrl = `${proxyUrl}${encodeURIComponent(weatherstackUrl)}`;
    const res = await axios.get(fullUrl, {
      params: {
        access_key: apiKey,
        query: cityName
      }
    });
    console.log("Weather API response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    // Return a default structure to prevent app crashing
    return {
      location: {
        name: cityName,
        country: "Unknown"
      },
      current: {
        temperature: 0,
        weather_descriptions: ["Unknown"],
        weather_code: 113 // Default to clear day
      }
    };
  }
};

export const getWeather = async (latitude, longitude) => {
  try {
    // Use coordinates to fetch location data first
    const geoResponse = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    const geoData = await geoResponse.json();
    const cityName = geoData.city || geoData.locality || geoData.countryName || "Unknown";
    
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
  } catch (error) {
    console.error("Error in getWeather:", error);
    // Return fallback data to prevent UI crash
    return {
      name: "Unknown Location",
      sys: { country: "" },
      weather: [{ main: "Unknown", description: "Weather data unavailable", icon: "01d" }],
      main: { temp: 0 }
    };
  }
};

// Updated mapping function based on real weatherstack weather codes
// See: https://weatherstack.com/documentation
const mapWeatherCodeToIcon = (code) => {
  // Clear
  if (code === 113) return "01d";
  
  // Partly cloudy
  if (code === 116) return "02d";
  if (code === 119) return "03d";
  
  // Cloudy
  if (code === 122) return "04d";
  if (code === 143) return "50d"; // Mist
  
  // Rain
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314].includes(code)) return "10d";
  if ([353, 356, 359, 362, 365].includes(code)) return "09d"; // Showers
  
  // Snow
  if ([179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].includes(code)) return "13d";
  
  // Thunderstorm
  if ([200, 386, 389, 392, 395].includes(code)) return "11d";
  
  // Default - use partly cloudy
  return "02d";
}
