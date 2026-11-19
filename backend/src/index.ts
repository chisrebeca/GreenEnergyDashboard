import express from "express";
import cors from "cors";
import "dotenv/config";
import { supabase } from "./supabase.js";
import { getUserRole, requireAdmin } from "./roleAuth.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Protejează toate operațiile de modificare a locațiilor, inclusiv rutele duplicate.
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return requireAdmin(req, res, next);
});

app.get("/api/me", async (req, res) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) { res.status(401).json({ error: "Autentificare necesară." }); return; }
  const result = await getUserRole(token);
  if (result.error || !result.user) { res.status(401).json({ error: "Sesiune invalidă sau expirată." }); return; }
  if (!result.role) { res.status(403).json({ error: "Contul nu are un rol configurat. Contactează administratorul." }); return; }
  res.json({ userId: result.user.id, role: result.role });
});

app.get("/", (_req, res) => res.json({ message: "Green Energy API functioneaza!" }));

app.get("/api/locations", async (_req, res) => {
  const { data, error } = await supabase.from("locations").select("*").order("id");
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

const validLocation = (body: unknown) => {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  if (typeof v.name !== "string" || !v.name.trim() || v.name.trim().length > 150) return null;
  if (typeof v.location_type !== "string" || !["campus", "camin", "industrial", "commercial"].includes(v.location_type)) return null;
  if (v.address != null && typeof v.address !== "string") return null;
  return {
    name: v.name.trim(),
    location_type: v.location_type,
    address: typeof v.address === "string" ? v.address.trim() || null : null,
  };
};

app.post("/api/locations", async (req, res) => {
  const values = validLocation(req.body);
  if (!values) { res.status(400).json({ error: "Completează corect numele și tipul locației." }); return; }
  const { data, error } = await supabase.from("locations").insert(values).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

app.put("/api/locations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const values = validLocation(req.body);
  if (!Number.isSafeInteger(id) || id < 1 || !values) {
    res.status(400).json({ error: "ID sau date invalide." }); return;
  }
  const { data, error } = await supabase.from("locations").update(values).eq("id", id).select().maybeSingle();
  if (error) { res.status(500).json({ error: error.message }); return; }
  if (!data) { res.status(404).json({ error: "Locația nu există." }); return; }
  res.json(data);
});

app.delete("/api/locations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "ID invalid." }); return; }
  const { data: existing, error: existingError } = await supabase.from("locations").select("id").eq("id", id).maybeSingle();
  if (existingError) { res.status(500).json({ error: existingError.message }); return; }
  if (!existing) { res.status(404).json({ error: "Locația nu există." }); return; }

  for (const table of ["devices", "consumption_thresholds"]) {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("location_id", id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    if ((count ?? 0) > 0) {
      res.status(409).json({ error: "Locația are date asociate și nu poate fi ștearsă. Elimină întâi dispozitivele sau pragurile asociate." }); return;
    }
  }
  const { count: userCount, error: userError } = await supabase.from("user_locations").select("user_id", { count: "exact", head: true }).eq("location_id", id);
  if (userError) { res.status(500).json({ error: userError.message }); return; }
  if ((userCount ?? 0) > 0) { res.status(409).json({ error: "Locația este atribuită unor utilizatori și nu poate fi ștearsă." }); return; }

  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) { res.status(409).json({ error: error.message }); return; }
  res.json({ success: true });
});

app.get("/api/devices", async (_req, res) => {
  const { data, error } = await supabase.from("devices").select("*").order("id");
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});
app.get("/api/measurements", async (_req, res) => {
  const { data, error } = await supabase.from("measurements").select("*").order("measured_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});
app.get("/api/energy", async (_req, res) => {
  const { data, error } = await supabase.from("daily_energy_balance").select("*").order("day", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});
app.get("/api/alerts", async (_req, res) => {
  const { data, error } = await supabase.from("alerts").select("*, consumption_thresholds(location_id, limit_kwh)").order("alert_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

type LocationInput = {
  name?: unknown;
  location_type?: unknown;
  address?: unknown;
};

function validateLocation(body: LocationInput) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const location_type =
    typeof body.location_type === "string"
      ? body.location_type.trim()
      : "";
  const address =
    typeof body.address === "string" && body.address.trim()
      ? body.address.trim()
      : null;

  if (!name || !location_type) {
    return { error: "Numele și tipul locației sunt obligatorii." };
  }

  return { data: { name, location_type, address } };
}

// Adaugă o locație
app.post("/api/locations", async (req, res) => {
  const result = validateLocation(req.body ?? {});

  if (result.error || !result.data) {
    res.status(400).json({ error: result.error });
    return;
  }

  const { data, error } = await supabase
    .from("locations")
    .insert(result.data)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

// Editează o locație
app.put("/api/locations/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID invalid." });
    return;
  }

  const result = validateLocation(req.body ?? {});

  if (result.error || !result.data) {
    res.status(400).json({ error: result.error });
    return;
  }

  const { data, error } = await supabase
    .from("locations")
    .update(result.data)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: "Locația nu există." });
    return;
  }

  res.json(data);
});

// Șterge o locație
app.delete("/api/locations/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID invalid." });
    return;
  }

  // Nu ștergem locații cu dispozitive sau praguri asociate.
  for (const table of ["devices", "consumption_thresholds", "user_locations"]) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("location_id", id)
      .limit(1);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (data && data.length > 0) {
      res.status(409).json({
        error: "Locația are date asociate și nu poate fi ștearsă."
      });
      return;
    }
  }

  const { data, error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: "Locația nu există." });
    return;
  }

  res.json({ message: "Locația a fost ștearsă." });
});

app.listen(PORT, () => console.log(`Server pornit: http://localhost:${PORT}`));
