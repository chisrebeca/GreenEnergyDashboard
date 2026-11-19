import type { Props, Location } from "../types";
import { number, allowedLocation } from "../utils";
import { useState, type FormEvent } from "react";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";

export default function Locations({ locations, devices, energy, selectedLocation, onRefresh, isAdmin = false }: Props) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Location | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState("campus");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const openForm = (location?: Location) => {
    setEditing(location ?? null);
    setName(location?.name ?? "");
    setLocationType(location?.location_type ?? "campus");
    setAddress(location?.address ?? "");
    setFormError("");
    setFormOpen(true);
  };

  const saveLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const url = editing
        ? `http://localhost:3001/api/locations/${editing.id}`
        : "http://localhost:3001/api/locations";
      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location_type: locationType.trim(),
          address: address.trim() || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Salvarea a eșuat.");
      await onRefresh();
      setFormOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Eroare necunoscută");
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (location: Location) => {
    if (!window.confirm(`Sigur dorești să ștergi locația „${location.name}”?`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/locations/${location.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Ștergerea a eșuat.");
      await onRefresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Eroare la ștergere");
    }
  };


  const allowed = (id: number) => allowedLocation(selectedLocation, id);
  const matches = (value: string) => value.toLowerCase().includes(search.toLowerCase());

    const visible = locations.filter(l =>
      allowed(l.id) &&
      matches(`${l.name} ${l.address ?? ""}`)
    );

    return (
      <div className="subpage">
        <div className="subpage-heading">
          {isAdmin && (
            <button className="crud-primary" onClick={() => openForm()}>
              <Plus size={16} /> Adaugă locație
            </button>
          )}
        </div>

        <input
          className="data-search"
          placeholder="Caută după nume sau adresă..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="location-cards">
          {visible.map(l => {
            const localDevices = devices.filter(
              d => d.location_id === l.id
            );
            const rows = energy.filter(
              e => e.location_id === l.id
            );
            const production = rows.reduce(
              (s, r) => s + Number(r.production_kwh ?? 0), 0
            );
            const consumption = rows.reduce(
              (s, r) => s + Number(r.consumption_kwh ?? 0), 0
            );

            return (
              <article className="data-panel" key={l.id}>
                <div className="data-panel-top">
                  <div className="data-icon"><MapPin size={20} /></div>
                  <span className="data-tag">{l.location_type}</span>
                </div>
                <h3>{l.name}</h3>
                <p>{l.address ?? "Adresă nespecificată"}</p>
                {isAdmin && (
                  <div className="crud-actions">
                    <button onClick={() => openForm(l)}><Pencil size={15} /> Editează</button>
                    <button className="crud-danger" onClick={() => deleteLocation(l)}><Trash2 size={15} /> Șterge</button>
                  </div>
                )}
                <div className="data-stats">
                  <div>
                    <small>Dispozitive</small>
                    <strong>{localDevices.length}</strong>
                  </div>
                  <div>
                    <small>Producție totală</small>
                    <strong>{number(production)} kWh</strong>
                  </div>
                  <div>
                    <small>Consum total</small>
                    <strong>{number(consumption)} kWh</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {isAdmin && formOpen && (
          <div className="crud-overlay" onClick={() => !saving && setFormOpen(false)}>
            <div className="crud-modal" role="dialog" aria-modal="true" aria-label="Formular locație" onClick={e => e.stopPropagation()}>
              <div className="crud-modal-header">
                <h3>{editing ? "Editează locația" : "Adaugă locație"}</h3>
                <button type="button" onClick={() => setFormOpen(false)} disabled={saving} aria-label="Închide"><X size={20} /></button>
              </div>
              <form onSubmit={saveLocation} className="crud-form">
                <label>Numele locației
                  <input required maxLength={150} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Campus Universitar" />
                </label>
                <label>Tipul locației
                  <select required value={locationType} onChange={e => setLocationType(e.target.value)}>
                    <option value="campus">Campus</option>
                    <option value="camin">Cămin</option>
                    <option value="industrial">Industrial</option>
                    <option value="commercial">Comercial</option>
                  </select>
                </label>
                <label>Adresă
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Strada, număr" />
                </label>
                {formError && <p className="crud-error">{formError}</p>}
                <div className="crud-form-footer">
                  <button type="button" onClick={() => setFormOpen(false)} disabled={saving}>Anulează</button>
                  <button className="crud-primary" type="submit" disabled={saving}>
                    {saving ? "Se salvează..." : editing ? "Salvează modificările" : "Adaugă locația"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
}
