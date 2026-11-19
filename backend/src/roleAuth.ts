import type { NextFunction, Request, Response } from "express";
import { supabase } from "./supabase.js";

export async function getUserRole(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { user: null, role: null, error: "Invalid access token." };
  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
  if (roleError) return { user: { id: data.user.id }, role: null, error: roleError.message };
  const role = roleRow?.role === "admin" || roleRow?.role === "user" ? roleRow.role : null;
  return { user: { id: data.user.id }, role, error: null };
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) { res.status(401).json({ error: "Autentificare necesară." }); return; }
  const result = await getUserRole(token);
  if (result.error || !result.user) { res.status(401).json({ error: "Sesiune invalidă sau expirată." }); return; }
  if (result.role !== "admin") { res.status(403).json({ error: "Nu ai permisiunea de administrator pentru această operație." }); return; }
  next();
}