import { useMemo } from "react";
import { Activity, Cpu, MapPin, Zap, ArrowUpRight, Sun } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { Props } from "../types";
const formatEnergy = (value: number) => new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(value);
export default function Dashboard({ locations, devices, energy, selectedLocation }: Props) {
  const filteredEnergy = useMemo(() => {
    if (selectedLocation === "all") return energy;

    return energy.filter(
      (row) => row.location_id === Number(selectedLocation)
    );
  }, [energy, selectedLocation]);

  const filteredDevices = useMemo(() => {
    if (selectedLocation === "all") return devices;

    return devices.filter(
      (device) => device.location_id === Number(selectedLocation)
    );
  }, [devices, selectedLocation]);

  const chartData = useMemo(() => {
    const byDay = new Map<
      string,
      { day: string; production: number; consumption: number }
    >();

    filteredEnergy.forEach((row) => {
      const current = byDay.get(row.day) ?? {
        day: row.day,
        production: 0,
        consumption: 0,
      };

      current.production += Number(row.production_kwh ?? 0);
      current.consumption += Number(row.consumption_kwh ?? 0);

      byDay.set(row.day, current);
    });

    return [...byDay.values()]
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14);
  }, [filteredEnergy]);

  const totalProduction = chartData.reduce(
    (sum, row) => sum + row.production,
    0
  );

  const totalConsumption = chartData.reduce(
    (sum, row) => sum + row.consumption,
    0
  );

  const balance = totalProduction - totalConsumption;

  const visibleLocations =
    selectedLocation === "all"
      ? locations
      : locations.filter(
          (location) => location.id === Number(selectedLocation)
        );

  return (<>
              <section className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-top">
                    <span>Total Production</span>
                    <Sun size={18} className="purple" />
                  </div>
                  <div className="metric-value">
                    {formatEnergy(totalProduction)}
                    <small>kWh</small>
                  </div>
                  <div className="metric-footer">
                    <span className="metric-accent purple-text">
                      <ArrowUpRight size={14} />
                      Production
                    </span>
                    <span>Ultimele 14 zile</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Total Consumption</span>
                    <Zap size={18} className="orange" />
                  </div>
                  <div className="metric-value">
                    {formatEnergy(totalConsumption)}
                    <small>kWh</small>
                  </div>
                  <div className="metric-footer">
                    <span className="metric-accent orange-text">
                      <Activity size={14} />
                      Consumption
                    </span>
                    <span>Ultimele 14 zile</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Energy Balance</span>
                    <Activity size={18} className="cyan" />
                  </div>
                  <div className="metric-value">
                    {formatEnergy(balance)}
                    <small>kWh</small>
                  </div>
                  <div className="metric-footer">
                    <span className="metric-accent cyan-text">
                      Net energy
                    </span>
                    <span>Producție − Consum</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Connected Devices</span>
                    <Cpu size={18} className="purple" />
                  </div>
                  <div className="metric-value">
                    {filteredDevices.length}
                    <small>devices</small>
                  </div>
                  <div className="metric-footer">
                    <span className="metric-accent purple-text">
                      <MapPin size={14} />
                      {visibleLocations.length} locații
                    </span>
                    <span>Înregistrate</span>
                  </div>
                </div>
              </section>

              <section className="analytics-grid">
                <div className="panel performance-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-eyebrow">ENERGY MONITORING</div>
                      <h2>Energy Performance</h2>
                      <p>Producție vs. consum energetic</p>
                    </div>
                    <span className="panel-pill">14 DAYS</span>
                  </div>

                  <div className="chart-container">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="productionGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#8B7CF8"
                                stopOpacity={0.28}
                              />
                              <stop
                                offset="100%"
                                stopColor="#8B7CF8"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            stroke="#252B45"
                            strokeDasharray="3 5"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tickFormatter={(value: string) =>
                              value.slice(5)
                            }
                            stroke="#77809E"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#77809E"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#191E34",
                              border: "1px solid #333955",
                              borderRadius: 10,
                              color: "#fff",
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="production"
                            name="Producție"
                            stroke="#9786FF"
                            fill="url(#productionGradient)"
                            strokeWidth={2.5}
                          />
                          <Area
                            type="monotone"
                            dataKey="consumption"
                            name="Consum"
                            stroke="#FFAC65"
                            fill="transparent"
                            strokeWidth={2.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state">
                        Nu există date energetice pentru această selecție.
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel generation-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-eyebrow">DAILY REPORT</div>
                      <h2>Energy Generated</h2>
                      <p>Producție energetică zilnică</p>
                    </div>
                    <span className="panel-pill">kWh</span>
                  </div>

                  <div className="chart-container">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid
                            stroke="#252B45"
                            strokeDasharray="3 5"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tickFormatter={(value: string) =>
                              value.slice(5)
                            }
                            stroke="#77809E"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#77809E"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#191E34",
                              border: "1px solid #333955",
                              borderRadius: 10,
                              color: "#fff",
                            }}
                          />
                          <Bar
                            dataKey="production"
                            name="Producție"
                            fill="#8B7CF8"
                            radius={[5, 5, 0, 0]}
                            maxBarSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state">
                        Nu există date disponibile.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="bottom-grid">
                <div className="panel locations-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-eyebrow">INFRASTRUCTURE</div>
                      <h2>Monitored Locations</h2>
                      <p>Locații conectate la sistem</p>
                    </div>
                    <span className="panel-pill">
                      {visibleLocations.length} LOCATIONS
                    </span>
                  </div>

                  <div className="location-list">
                    {visibleLocations.map((location) => (
                      <div className="location-row" key={location.id}>
                        <div className="location-symbol">
                          <MapPin size={18} />
                        </div>
                        <div className="location-details">
                          <strong>{location.name}</strong>
                          <span>
                            {location.address ?? "Adresă nespecificată"}
                          </span>
                        </div>
                        <div className="location-type">
                          {location.location_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel system-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-eyebrow">SYSTEM INFORMATION</div>
                      <h2>Infrastructure Status</h2>
                      <p>Dispozitive înregistrate</p>
                    </div>
                    <Cpu size={19} className="purple" />
                  </div>

                  <div className="system-stat">
                    <span>Total devices</span>
                    <strong>{filteredDevices.length}</strong>
                  </div>

                  <div className="system-stat">
                    <span>Producers</span>
                    <strong>
                      {
                        filteredDevices.filter(
                          (device) => device.device_type === "producer"
                        ).length
                      }
                    </strong>
                  </div>

                  <div className="system-stat">
                    <span>Consumers</span>
                    <strong>
                      {
                        filteredDevices.filter(
                          (device) => device.device_type === "consumer"
                        ).length
                      }
                    </strong>
                  </div>

                  <div className="system-note">
                    Date preluate din baza de date Supabase.
                  </div>
                </div>
              </section>

  </>);
}
