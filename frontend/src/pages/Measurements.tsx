import type { Props } from "../types";
import { number, date, allowedLocation } from "../utils";
import { useState } from "react";
import { Activity } from "lucide-react";

export default function Measurements({ measurements, devices, selectedLocation }: Props) {
  const [search, setSearch] = useState("");
  const allowed = (id: number) => allowedLocation(selectedLocation, id);
  const matches = (value: string) => value.toLowerCase().includes(search.toLowerCase());
  const deviceName = (id: number) => devices.find(d => d.id === id)?.name ?? `Dispozitiv ${id}`;
  const filteredMeasurements = measurements.filter(m => { const device = devices.find(d => d.id === m.device_id); return device && allowed(device.location_id); });

    const visible = filteredMeasurements.filter(m =>
      matches(`${deviceName(m.device_id)} ${m.measured_at}`)
    );

    return (
      <div className="subpage">
        <div className="subpage-heading">
          <h2><Activity size={20} /> Măsurători energetice</h2>
          <span>{visible.length} înregistrări</span>
        </div>
        <input
          className="data-search"
          placeholder="Caută dispozitivul sau data..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="data-panel table-scroll">
          <table className="energy-table">
            <thead>
              <tr>
                <th>ID</th><th>Dispozitiv</th>
                <th>Data măsurării</th><th>Energie</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(m => (
                <tr key={m.id}>
                  <td>#{m.id}</td>
                  <td>{deviceName(m.device_id)}</td>
                  <td>{date(m.measured_at)}</td>
                  <td><strong>{number(Number(m.energy_kwh))} kWh</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <p>Nu există măsurători.</p>}
        </div>
      </div>
    );
}
