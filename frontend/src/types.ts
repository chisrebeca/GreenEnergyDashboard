export type Location = {
  id: number;
  name: string;
  location_type: string;
  address: string | null;
};

export type Device = {
  id: number;
  name: string;
  device_type: string;
  power_kw: number;
  location_id: number;
};

export type Measurement = {
  id: number;
  device_id: number;
  measured_at: string;
  energy_kwh: number;
};

export type EnergyRow = {
  location_id: number;
  day: string;
  production_kwh?: number;
  consumption_kwh?: number;
};

export type Alert = {
  id: number;
  alert_at: string;
  consumption_date: string | null;
  message: string;
  status: string;
  consumption_thresholds: {
    location_id: number;
    limit_kwh: number;
  } | null;
};


export type Props = {
  locations: Location[];
  devices: Device[];
  measurements: Measurement[];
  energy: EnergyRow[];
  alerts: Alert[];
  selectedLocation: string;
  onRefresh: () => Promise<void>;
  isAdmin?: boolean;
};


