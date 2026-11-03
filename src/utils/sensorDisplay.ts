import theme from "@/theme";

// Sensor names are drawn from a closed list of 20 in genSensorData.js
// (e.g. "Warehouse A - Zone 1", "Cold Storage Room 2") — not arbitrary
// freeform text, so keyword-matching against that fixed set is reliable
// rather than fragile. Order doesn't matter here since the categories
// are distinct, non-overlapping substrings.
export function getLocationIcon(name: string): string {
  if (name.includes("Warehouse")) return "🏭";
  if (name.includes("Cold Storage")) return "🧊";
  if (name.includes("Greenhouse")) return "🌿";
  if (name.includes("Server Room")) return "🖥️";
  if (name.includes("Office")) return "🏢";
  if (name.includes("Production Line")) return "⚙️";
  if (name.includes("Loading Bay")) return "🚛";
  if (name.includes("Rooftop")) return "🏙️";
  if (name.includes("Basement")) return "🗄️";
  if (name.includes("Packaging")) return "📦";
  if (name.includes("Cleanroom")) return "🧪";
  return "📍";
}

// Everything that visually distinguishes a temperature sensor from a
// humidity one, in one place so the list row and the detail screen can't
// drift apart.
// e.g. 4.2 -> "+4.20%", -1.5 -> "-1.50%". Always 2 decimals, so the text
// keeps a steady width as the live value ticks. deviationPercent already carries
// its own sign in the data, so this only adds the "+" for positive values
// and the "%" suffix — the raw number alone reads as ambiguous (percent of
// what?) without it.
export function formatDeviation(deviationPercent: number): string {
  const sign = deviationPercent > 0 ? "+" : "";
  return `${sign}${deviationPercent.toFixed(2)}%`;
}

export function getTypeStyle(type: string) {
  return type === "temperature"
    ? {
        color: theme.colors.temperature,
        tint: theme.colors.temperatureTint,
        icon: "🌡️",
        label: "Temperature",
      }
    : {
        color: theme.colors.humidity,
        tint: theme.colors.humidityTint,
        icon: "💧",
        label: "Humidity",
      };
}
