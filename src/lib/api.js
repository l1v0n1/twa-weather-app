import axios from "axios";

// Weatherstack API configuration
const weatherstackUrl = 'http://api.weatherstack.com/current';
const apiKey = 'a4526f4e34340020b34865e2cc70d5d9';

// Fallback OpenWeatherMap API (supports HTTPS)
const openWeatherMapUrl = 'https://api.openweathermap.org/data/2.5/weather';
const openWeatherApiKey = '4c496bb5161a3d93a2bc05d9a9d29a18';

// Try to fetch from weatherstack first, then fallback to OpenWeatherMap
const fetchData = async (cityName) => {
  console.log(`Fetching weather for: ${cityName}`);
  
  try {
    // Try weatherstack first
    const weatherstackResponse = await axios.get(weatherstackUrl, {
      params: {
        access_key: apiKey,
        query: cityName
      },
      timeout: 5000
    });
    
    if (weatherstackResponse.data && !weatherstackResponse.data.error) {
      console.log("Weatherstack API success:", weatherstackResponse.data);
      return {
        source: 'weatherstack',
        data: weatherstackResponse.data
      };
    }
    
    throw new Error('Invalid weatherstack response');
  } catch (error) {
    console.warn("Weatherstack API failed, trying OpenWeatherMap:", error);
    
    try {
      // Fallback to OpenWeatherMap
      const openWeatherResponse = await axios.get(openWeatherMapUrl, {
        params: {
          q: cityName,
          appid: openWeatherApiKey,
          units: 'metric'
        },
        timeout: 5000
      });
      
      console.log("OpenWeatherMap API success:", openWeatherResponse.data);
      return {
        source: 'openweathermap',
        data: openWeatherResponse.data
      };
    } catch (fallbackError) {
      console.error("All weather APIs failed:", fallbackError);
      
      // Final fallback - hardcoded data
      return {
        source: 'fallback',
        data: {
          name: cityName,
          location: {
            name: cityName,
            country: "Turkey"
          },
          current: {
            temperature: 18,
            weather_descriptions: ["Sunny"],
            weather_code: 113
          }
        }
      };
    }
  }
};

export const getWeather = async (latitude, longitude) => {
  try {
    console.log(`Getting weather for coordinates: ${latitude}, ${longitude}`);
    
    // Use coordinates to fetch location data first
    const geoResponse = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    const geoData = await geoResponse.json();
    console.log("Geo data:", geoData);
    
    // Get city name or fall back to country
    const cityName = geoData.city || geoData.locality || geoData.countryName || "Gelibolu";
    console.log("Using city name:", cityName);
    
    // Get weather data with automatic fallbacks
    const result = await fetchData(cityName);
    console.log("Weather result:", result);
    
    // Transform the data based on source
    if (result.source === 'weatherstack') {
      const data = result.data;
      return {
        name: data.location.name || cityName,
        sys: { 
          country: data.location.country || "Turkey"
        },
        weather: [
          {
            main: data.current.weather_descriptions?.[0] || "Clear",
            description: data.current.weather_descriptions?.[0] || "Clear Sky",
            icon: mapWeatherstackCodeToIcon(data.current.weather_code || 113)
          }
        ],
        main: {
          temp: data.current.temperature || 18
        }
      };
    } else if (result.source === 'openweathermap') {
      const data = result.data;
      return {
        name: data.name || cityName,
        sys: data.sys || { country: "Turkey" },
        weather: data.weather || [{ 
          main: "Clear", 
          description: "Clear Sky", 
          icon: "01d" 
        }],
        main: data.main || { temp: 18 }
      };
    } else {
      // Fallback data
      return {
        name: cityName,
        sys: { country: "Turkey" },
        weather: [{ main: "Clear", description: "Clear Sky", icon: "01d" }],
        main: { temp: 18 }
      };
    }
  } catch (error) {
    console.error("Error in getWeather:", error);
    
    // Hard fallback to prevent UI crash
    return {
      name: "Gelibolu",
      sys: { country: "Turkey" },
      weather: [{ main: "Clear", description: "Clear Sky", icon: "01d" }],
      main: { temp: 18 }
    };
  }
};

// Map weatherstack weather codes to OpenWeatherMap-like icons
const mapWeatherstackCodeToIcon = (code) => {
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
