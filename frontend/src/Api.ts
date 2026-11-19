const API_URL = "http://localhost:3001";

async function getData(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Eroare API: ${response.status}`);
  }

  return response.json();
}

export const getLocations = () => getData("/api/locations");
export const getDevices = () => getData("/api/devices");
export const getEnergy = () => getData("/api/energy");
export const getMeasurements = () => getData("/api/measurements");
export const getAlerts = () => getData("/api/alerts");