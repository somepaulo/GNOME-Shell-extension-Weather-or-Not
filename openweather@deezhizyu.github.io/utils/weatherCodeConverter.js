export default function weatherCodeToSymbolicIconName(code, isDay) {
  // Clear/Sunny conditions (codes 0, 1)
  if (["0", "1"].includes(code)) {
    return isDay ? "weather-clear-symbolic" : "weather-clear-night-symbolic";
  }

  // Partly cloudy (code 2)
  if (code === "2") {
    return isDay
      ? "weather-few-clouds-symbolic"
      : "weather-few-clouds-night-symbolic";
  }

  // Cloudy/Overcast (code 3)
  if (code === "3") {
    return "weather-overcast-symbolic";
  }

  // Fog (codes 45, 48)
  if (["45", "48"].includes(code)) {
    return "weather-fog-symbolic";
  }

  // Rain/Drizzle/Showers (codes 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82)
  if (
    [
      "51",
      "53",
      "55",
      "56",
      "57",
      "61",
      "63",
      "65",
      "66",
      "67",
      "80",
      "81",
      "82",
    ].includes(code)
  ) {
    return "weather-showers-symbolic";
  }

  // Snow (codes 71, 73, 75, 77, 85, 86)
  if (["71", "73", "75", "77", "85", "86"].includes(code)) {
    return "weather-snow-symbolic";
  }

  // Thunderstorm (codes 95, 96, 99)
  if (["95", "96", "99"].includes(code)) {
    return "weather-storm-symbolic";
  }

  // Default fallback
  return "weather-clear-symbolic";
}
