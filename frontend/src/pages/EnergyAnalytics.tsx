import type { Props } from "../types";
import { number, allowedLocation } from "../utils";
import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function EnergyAnalytics({ energy, selectedLocation }: Props) {
  const filteredEnergy = energy.filter(e => allowedLocation(selectedLocation, e.location_id));
  const chartData = (() => {
    const days = new Map<string, {
      day: string;
      production: number;
      consumption: number;
    }>();

    filteredEnergy.forEach(e => {
      const row = days.get(e.day) ?? {
        day: e.day, production: 0, consumption: 0
      };

      row.production += Number(e.production_kwh ?? 0);
      row.consumption += Number(e.consumption_kwh ?? 0);
      days.set(e.day, row);
    });

    return [...days.values()].sort((a, b) =>
      a.day.localeCompare(b.day)
    );
  })();

  const totalProduction = chartData.reduce(
    (s, r) => s + r.production, 0
  );
  const totalConsumption = chartData.reduce(
    (s, r) => s + r.consumption, 0
  );


    return (
      <div className="subpage">
        <div className="subpage-heading">
         
          <span>Analiză energetică</span>
        </div>

        <div className="analytics-summary">
          <div className="data-panel">
            <small>Producție totală</small>
            <h3>{number(totalProduction)} kWh</h3>
          </div>
          <div className="data-panel">
            <small>Consum total</small>
            <h3>{number(totalConsumption)} kWh</h3>
          </div>
          <div className="data-panel">
            <small>Balanță</small>
            <h3>{number(totalProduction - totalConsumption)} kWh</h3>
          </div>
        </div>

        <div className="data-panel">
          <h3>Evoluția energiei</h3>
          <div style={{ width: "100%", height: 340 }}>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="#2a3049" vertical={false} />
                  <XAxis dataKey="day" stroke="#8d96b3" fontSize={11} />
                  <YAxis stroke="#8d96b3" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Area
                    dataKey="production"
                    name="Producție"
                    stroke="#9887ff"
                    fill="#9887ff"
                    fillOpacity={0.12}
                  />
                  <Area
                    dataKey="consumption"
                    name="Consum"
                    stroke="#ffac65"
                    fill="#ffac65"
                    fillOpacity={0.06}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p>Nu există date energetice.</p>}
          </div>
        </div>
      </div>
    );
}
