import { supabase } from "./lib/supabase";

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

export type UserRole = "admin" | "user";

export async function getCurrentRole(): Promise<UserRole> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sesiunea nu este validă.");
  const response = await fetch(`${API_URL}/api/me`, {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Nu s-a putut verifica rolul.");
  return result.role === "admin" ? "admin" : "user";
}
