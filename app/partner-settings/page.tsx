"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

type ProfileRow = {
  id: string;
  role?: string | null;
};

type PartnerForm = {
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  instagram_url: string;
  website_url: string;
  logo_url: string;
  cashback_percent: string;
};

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function PartnerSettingsPage() {
  const router = useRouter();

  const [partnerUserId, setPartnerUserId] = useState("");
  const [form, setForm] = useState<PartnerForm>({
    name: "",
    category: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    instagram_url: "",
    website_url: "",
    logo_url: "",
    cashback_percent: "2",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(key: keyof PartnerForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function loadPartner(userId: string) {
    const { response, data } = await safeJsonFetch(
      `${API_URL}/partner/me?user_id=${encodeURIComponent(userId)}`
    );

    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || "Partner non trovato");
    }

    const partner = data?.partner;

    setPartnerUserId(userId);

    setForm({
      name: String(partner?.name || ""),
      category: String(partner?.category || ""),
      description: String(partner?.description || ""),
      address: String(partner?.address || ""),
      city: String(partner?.city || ""),
      phone: String(partner?.phone || ""),
      instagram_url: String(partner?.instagram_url || ""),
      website_url: String(partner?.website_url || ""),
      logo_url: String(partner?.logo_url || ""),
      cashback_percent: String(toNumberSafe(partner?.cashback_percent) || 2),
    });
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (profileError) {
          throw new Error(profileError.message || "Errore controllo profilo");
        }

        const role = String(profile?.role || "user").toLowerCase();

        if (role !== "partner") {
          router.push("/dashboard");
          return;
        }

        await loadPartner(user.id);
      } catch (err: any) {
        setError(err?.message || "Errore caricamento impostazioni partner");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cashback = toNumberSafe(form.cashback_percent);

    if (!partnerUserId) {
      setError("Partner non riconosciuto.");
      return;
    }

    if (!form.name.trim()) {
      setError("Inserisci il nome del locale.");
      return;
    }

    if (cashback < 0 || cashback > 30) {
      setError("Il cashback deve essere compreso tra 0 e 30.");
      return;
    }

    try {
      setSaving(true);

      const { response, data } = await safeJsonFetch(
        `${API_URL}/partner/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            partner_user_id: partnerUserId,
            name: form.name.trim(),
            category: form.category.trim(),
            description: form.description.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            phone: form.phone.trim(),
            instagram_url: form.instagram_url.trim(),
            website_url: form.website_url.trim(),
            logo_url: form.logo_url.trim(),
            cashback_percent: cashback,
          }),
        }
      );

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Errore salvataggio impostazioni");
      }

      setMessage("Impostazioni locale aggiornate correttamente.");
      await loadPartner(partnerUserId);
    } catch (err: any) {
      setError(err?.message || "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>Caricamento impostazioni partner...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={topNavStyle}>
        <Link href="/partner-dashboard" style={navLinkStyle}>
          ← Dashboard partner
        </Link>

        <Link href="/partner-console" style={navLinkStyle}>
          Vai alla console →
        </Link>
      </div>

      <section style={cardStyle}>
        <p style={eyebrowStyle}>GUFO PARTNER SETTINGS</p>

        <h1 style={titleStyle}>Impostazioni locale</h1>

        <p style={subtitleStyle}>
          Gestisci profilo pubblico del locale, categoria, contatti e cashback
          predefinito usato nella Partner Console.
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {message && <div style={successStyle}>{message}</div>}

        <form onSubmit={handleSave} style={{ marginTop: "24px" }}>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nome locale *</label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                style={inputStyle}
                placeholder="Es. Pizzeria Mario"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Categoria</label>
              <input
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                style={inputStyle}
                placeholder="Es. Ristorante, Bar, Pub"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Cashback predefinito (%)</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.01"
                value={form.cashback_percent}
                onChange={(e) => updateField("cashback_percent", e.target.value)}
                style={inputStyle}
              />

              <div style={quickButtonsStyle}>
                {[2, 3, 5, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField("cashback_percent", String(value))}
                    style={quickBtnStyle}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Città</label>
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                style={inputStyle}
                placeholder="Es. Savona"
              />
            </div>

            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Bio / descrizione locale</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                style={textareaStyle}
                placeholder="Descrivi il locale, cosa offre e perché i clienti dovrebbero tornarci."
              />
            </div>

            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Indirizzo</label>
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                style={inputStyle}
                placeholder="Es. Via Roma 10"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Telefono</label>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                style={inputStyle}
                placeholder="Es. +39 333 1234567"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Instagram URL</label>
              <input
                value={form.instagram_url}
                onChange={(e) => updateField("instagram_url", e.target.value)}
                style={inputStyle}
                placeholder="https://instagram.com/tuolocale"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Sito web</label>
              <input
                value={form.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                style={inputStyle}
                placeholder="https://tuolocale.it"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Logo URL</label>
              <input
                value={form.logo_url}
                onChange={(e) => updateField("logo_url", e.target.value)}
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
          </div>

          <button type="submit" disabled={saving} style={saveBtnStyle}>
            {saving ? "Salvataggio..." : "Salva impostazioni locale"}
          </button>
        </form>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 20% 10%, rgba(124,58,237,0.28), transparent 35%), linear-gradient(180deg, #050816, #090b22)",
  color: "white",
  padding: "28px",
};

const topNavStyle: React.CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "10px 14px",
  borderRadius: "999px",
};

const cardStyle: React.CSSProperties = {
  maxWidth: "980px",
  margin: "32px auto 0",
  padding: "24px",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
};

const loadingStyle: React.CSSProperties = {
  maxWidth: "760px",
  margin: "80px auto",
  padding: "24px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#a78bfa",
  fontWeight: 900,
  letterSpacing: "0.12em",
  fontSize: "12px",
  margin: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: "42px",
  lineHeight: 1,
  margin: "12px 0 10px",
};

const subtitleStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  maxWidth: "720px",
  lineHeight: 1.6,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "rgba(255,255,255,0.88)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "16px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "120px",
  resize: "vertical",
};

const quickButtonsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "8px",
};

const quickBtnStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const saveBtnStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "22px",
  padding: "17px",
  borderRadius: "18px",
  border: "0",
  color: "white",
  fontWeight: 950,
  cursor: "pointer",
  background: "linear-gradient(135deg, #f59e0b, #ec4899, #7c3aed)",
  boxShadow: "0 18px 44px rgba(236,72,153,0.28)",
};

const errorStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
};

const successStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.35)",
  color: "#bbf7d0",
};