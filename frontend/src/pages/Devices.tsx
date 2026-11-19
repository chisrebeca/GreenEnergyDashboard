
import { useMemo, useState } from "react";
import { Cpu, Search, Sun, Zap } from "lucide-react";

import type {
  Location,
  Device,
  Measurement,
  EnergyRow,
  Alert,
} from "../types";

type Props = {
  locations: Location[];
  devices: Device[];
  measurements: Measurement[];
  energy: EnergyRow[];
  alerts: Alert[];
  selectedLocation: string;
  onRefresh: () => Promise<void>;
};

export default function Devices({
  locations,
  devices,
  selectedLocation,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<
    "producer" | "consumer"
  >("producer");

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesLocation =
        selectedLocation === "all" ||
        device.location_id === Number(selectedLocation);

      const matchesType =
        device.device_type === selectedType;

      const location = locations.find(
        (loc) => loc.id === device.location_id
      );

      const matchesSearch =
        device.name.toLowerCase().includes(search.toLowerCase()) ||
        (location?.name ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesLocation && matchesType && matchesSearch;
    });
  }, [devices, locations, selectedLocation, selectedType, search]);

  const producerCount = devices.filter(
    (device) =>
      device.device_type === "producer" &&
      (selectedLocation === "all" ||
        device.location_id === Number(selectedLocation))
  ).length;

  const consumerCount = devices.filter(
    (device) =>
      device.device_type === "consumer" &&
      (selectedLocation === "all" ||
        device.location_id === Number(selectedLocation))
  ).length;

  return (
    <section className="subpage">
      <div className="subpage-heading">
        

        <span>
          {filteredDevices.length} dispozitive
        </span>
      </div>

      <div className="device-type-tabs">
        <button
          type="button"
          className={`device-type-btn ${
            selectedType === "producer" ? "active producer" : ""
          }`}
          onClick={() => setSelectedType("producer")}
        >
          <Sun size={18} />
          Producători
          <span>{producerCount}</span>
        </button>

        <button
          type="button"
          className={`device-type-btn ${
            selectedType === "consumer" ? "active consumer" : ""
          }`}
          onClick={() => setSelectedType("consumer")}
        >
          <Zap size={18} />
          Consumatori
          <span>{consumerCount}</span>
        </button>
      </div>

      <div className="device-search-wrapper">
        <Search size={18} />
        <input
          className="data-search"
          type="text"
          placeholder="Caută un dispozitiv..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="data-panel">
        <div className="table-scroll">
          <table className="energy-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>DISPOZITIV</th>
                <th>TIP</th>
                <th>PUTERE</th>
                <th>LOCAȚIE</th>
              </tr>
            </thead>

            <tbody>
              {filteredDevices.map((device) => {
                const location = locations.find(
                  (loc) => loc.id === device.location_id
                );

                return (
                  <tr key={device.id}>
                    <td>#{device.id}</td>
                    <td>
                      <strong>{device.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`data-tag ${
                          device.device_type === "producer"
                            ? "producer"
                            : "consumer"
                        }`}
                      >
                        {device.device_type === "producer"
                          ? "Producător"
                          : "Consumator"}
                      </span>
                    </td>
                    <td>{device.power_kw} kW</td>
                    <td>{location?.name ?? "Necunoscută"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredDevices.length === 0 && (
            <div className="empty-state">
              Nu există dispozitive pentru filtrele selectate.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
