import type { Props } from "../types";
import { number, date, allowedLocation } from "../utils";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Alert } from "../types";

export default function Alerts({ alerts, locations, selectedLocation }: Props) {
  const [alertTab, setAlertTab] = useState("active");
  const allowed = (id: number) => allowedLocation(selectedLocation, id);
  const locationName = (id: number) => locations.find(l => l.id === id)?.name ?? `Locația ${id}`;
  const filteredAlerts = alerts.filter(a => a.consumption_thresholds && allowed(a.consumption_thresholds.location_id));
  // O singură alertă activă per locație, cea mai recentă.
  const activeAlerts = useMemo(() => {
    const byLocation = new Map<number, Alert>();

    [...filteredAlerts]
      .filter(a => a.status === "active")
      .sort((a, b) => b.alert_at.localeCompare(a.alert_at))
      .forEach(alert => {
        const id = alert.consumption_thresholds!.location_id;
        if (!byLocation.has(id)) byLocation.set(id, alert);
      });

    return [...byLocation.values()];
  }, [filteredAlerts]);


    const history = [...filteredAlerts].sort(
      (a, b) => b.alert_at.localeCompare(a.alert_at)
    );
    const visible = alertTab === "active" ? activeAlerts : history;

    return (
      <div className="subpage">
        <div className="subpage-heading">
          <h2><AlertTriangle size={20} /> Monitorizare alerte</h2>
          <span>{activeAlerts.length} locații cu alerte active</span>
        </div>

        <div className="alert-tabs">
          <button
            className={alertTab === "active" ? "chosen" : ""}
            onClick={() => setAlertTab("active")}
          >
            Alerte active ({activeAlerts.length})
          </button>
          <button
            className={alertTab === "history" ? "chosen" : ""}
            onClick={() => setAlertTab("history")}
          >
            Istoric complet ({history.length})
          </button>
        </div>

        <div className="alert-list">
          {visible.map(a => (
            <article className="data-panel alert-item" key={a.id}>
              <div className="data-icon warning">
                <AlertTriangle size={19} />
              </div>
              <div className="alert-description">
                <div className="alert-title">
                  <strong>
                    {locationName(a.consumption_thresholds!.location_id)}
                  </strong>
                  <span className={`data-tag ${a.status}`}>
                    {a.status === "active" ? "Activă" : "Rezolvată"}
                  </span>
                </div>
                <p>{a.message}</p>
                <small>
                  {date(a.alert_at)} · Prag:
                  {" "}{number(Number(a.consumption_thresholds!.limit_kwh))} kWh
                </small>
              </div>
            </article>
          ))}
          {!visible.length && (
            <div className="data-panel">
              Nu există alerte pentru selecția curentă.
            </div>
          )}
        </div>
      </div>
    );
}
