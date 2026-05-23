"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./partner-clienti.module.css";

const supabase = createClient();

type SegmentKey =
  | "all"
  | "zona"
  | "tornati"
  | "mai_zona"
  | "abituali"
  | "top"
  | "one_time"
  | "fasce_orarie"
  | "inattivi";

type ActionPanel = "missione" | "promo" | "cashback" | "notifica" | null;
type SortBy = "recenti" | "meno_recenti" | "spesa_media" | "spesa_mensile";
type RiskFilter = "all" | "low" | "medium" | "high";

type ClientItem = {
  id: string;
  code: string;
  segment: SegmentKey;
  label: string;
  visits: number;
  totalSpent: number;
  averageSpent: number;
  monthlySpent: number;
  daysFromLastVisit: number;
  lastVisit: string;
  favoriteTime: string;
  returnProbability: number;
};

const segments = [
  {
    key: "all",
    title: "Tutti i clienti",
    subtitle: "Panoramica completa",
    metric: "Database clienti",
    action: "Analizza",
  },
  {
    key: "zona",
    title: "Clienti in zona",
    subtitle: "Utenti rilevati vicino al locale",
    metric: "Potenziale immediato",
    action: "Invia promo",
  },
  {
    key: "tornati",
    title: "Clienti tornati",
    subtitle: "Hanno effettuato più visite",
    metric: "Retention attiva",
    action: "Premia",
  },
  {
    key: "mai_zona",
    title: "Mai entrati in zona",
    subtitle: "Clienti raggiungibili ma mai convertiti",
    metric: "Da acquisire",
    action: "Attira",
  },
  {
    key: "abituali",
    title: "Clienti abituali",
    subtitle: "Tornano spesso nel punto vendita",
    metric: "Alta fedeltà",
    action: "Crea missione",
  },
  {
    key: "top",
    title: "Clienti top",
    subtitle: "Generano più valore",
    metric: "Alta spesa",
    action: "Promo VIP",
  },
  {
    key: "one_time",
    title: "Entrati 1 volta",
    subtitle: "Clienti da recuperare subito",
    metric: "Rischio perdita",
    action: "Riattiva",
  },
  {
    key: "fasce_orarie",
    title: "Fasce orarie",
    subtitle: "Analisi per mattina, pranzo, sera",
    metric: "Timing marketing",
    action: "Ottimizza",
  },
  {
    key: "inattivi",
    title: "Inattivi da 30 giorni",
    subtitle: "Non tornano da tempo",
    metric: "Recupero clienti",
    action: "Recupera",
  },
] satisfies {
  key: SegmentKey;
  title: string;
  subtitle: string;
  metric: string;
  action: string;
}[];

function getRiskLabel(probability: number) {
  if (probability < 40) return "Alto rischio abbandono";
  if (probability < 70) return "Medio rischio abbandono";
  return "Basso rischio abbandono";
}

function getRiskType(probability: number): Exclude<RiskFilter, "all"> {
  if (probability < 40) return "high";
  if (probability < 70) return "medium";
  return "low";
}

export default function PartnerClientiPage() {
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("all");
  const [activeAction, setActiveAction] = useState<ActionPanel>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recenti");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [successMessage, setSuccessMessage] = useState("");

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [missionTitle, setMissionTitle] = useState("Cena da noi entro 72 ore");
  const [missionType, setMissionType] =
  useState<"daily" | "weekly" | "monthly">("daily");
  const [missionMinSpend, setMissionMinSpend] = useState("2");
  const [missionDuration, setMissionDuration] = useState("72h");


  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Utente non autenticato");
          return;
        }

        const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const {
  data: { session },
} = await supabase.auth.getSession();

const token = session?.access_token;

if (!token) {
  setError("Sessione non valida");
  return;
}

const result = await safeJsonFetch(`${apiUrl}/partner-customers/me`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const rawCustomers = result?.data?.customers || [];

const clientsData = rawCustomers.map((customer: any) => ({
  id: customer.user_id,
  code: customer.customer_code || customer.user_id,
  segment:
    customer.segment === "regular"
      ? "abituali"
      : customer.segment === "one_visit"
      ? "one_time"
      : customer.segment === "inactive_30"
      ? "inattivi"
      : "tornati",
  label: `${customer.visits} visite · ${customer.days_since_last_visit ?? 0} giorni dall’ultima visita`,
  visits: customer.visits,
  totalSpent: customer.total_spent,
  averageSpent: customer.avg_spent,
  monthlySpent: customer.total_spent,
  daysFromLastVisit: customer.days_since_last_visit ?? 0,
  lastVisit: customer.last_visit
    ? new Date(customer.last_visit).toLocaleDateString("it-IT")
    : "-",
  favoriteTime: "Dati in analisi",
  returnProbability:
    customer.segment === "inactive_30"
      ? 30
      : customer.segment === "one_visit"
      ? 45
      : customer.segment === "regular"
      ? 85
      : 65,
}));

if (!clientsData.length) {
  setClients([]);
  setError("Nessun cliente trovato per questo partner");
  return;
}

setClients(clientsData);
setStats(result?.data?.stats || null);
setAiSuggestion(result?.data?.ai_suggestion || "");
      } catch (err: any) {
        console.error("Errore caricamento clienti:", err);
        setError(err?.message || "Errore caricamento clienti");
      } finally {
        setLoading(false);
      }
    }



    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const bySegment =
      activeSegment === "all"
        ? clients
        : clients.filter((client) => client.segment === activeSegment);

    const bySearch = bySegment.filter((client) =>
      client.code.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    const byRisk =
      riskFilter === "all"
        ? bySearch
        : bySearch.filter(
            (client) => getRiskType(client.returnProbability) === riskFilter
          );

    return [...byRisk].sort((a, b) => {
      if (sortBy === "spesa_media") return b.averageSpent - a.averageSpent;
      if (sortBy === "spesa_mensile") return b.monthlySpent - a.monthlySpent;
      if (sortBy === "meno_recenti") {
        return b.daysFromLastVisit - a.daysFromLastVisit;
      }

      return a.daysFromLastVisit - b.daysFromLastVisit;
    });
  }, [activeSegment, clients, riskFilter, searchTerm, sortBy]);

  const activeSegmentData = segments.find((item) => item.key === activeSegment);

  const highRiskCount = filteredClients.filter(
    (client) => getRiskType(client.returnProbability) === "high"
  ).length;

async function createMissionFromAI() {
  try {
    setError("");

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);

    const response = await fetch(`${apiUrl}/missions/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: missionTitle,
        description:
          aiSuggestion ||
          "Missione automatica generata da GUFO AI Marketing.",
        type: missionType,
        min_spend: Number(missionMinSpend),
        reward_percent: 10,
        condition_type: "transaction_count",
        condition_value: 1,
        target_segment: activeSegment,
        start_at: now.toISOString(),
        end_at: end.toISOString(),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Errore creazione missione");
    }

    handleActionSuccess("Missione reale creata correttamente nel database.");
  } catch (err: any) {
    setError(err.message || "Errore creazione missione");
  }
}

  function handleActionSuccess(message: string) {
    setSuccessMessage(message);
    setActiveAction(null);

    setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>GUFO Premium</p>
          <h1>Clienti & AI Analytics</h1>
          <p>
            Analizza i clienti, segmenta i comportamenti e lancia missioni o
            promo personalizzate in base ai dati reali.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div>
            <strong>{clients.length}</strong>
            <span>clienti analizzati</span>
          </div>
          <div>
            <strong>{stats?.regular_customers || 0}</strong>
          <span>clienti abituali</span>
          </div>
          <div>
            <strong>{stats?.inactive_30_customers || 0}</strong>
        <span>inattivi 30 giorni</span>
          </div>
        </div>
      </section>

      {loading && (
        <div className={styles.loadingBox}>Caricamento clienti reali...</div>
      )}

      {error && !loading && <div className={styles.errorBox}>{error}</div>}

<section className={styles.segmentSection}>
  <div className={styles.sectionHead}>
    <div>
      <p className={styles.eyebrow}>Statistiche reali</p>
      <h2>Panoramica clienti</h2>
    </div>
    <p>Dati calcolati dalle transazioni reali del partner.</p>
  </div>

  <div className={styles.segmentGrid}>
    <div className={styles.segmentCard}>
      <span>Database clienti</span>
      <h3>{stats?.total_customers || 0}</h3>
      <p>Clienti totali</p>
      <small>👥 Totale</small>
    </div>

    <div className={styles.segmentCard}>
      <span>Alta fedeltà</span>
      <h3>{stats?.regular_customers || 0}</h3>
      <p>Clienti abituali</p>
      <small>🟢 Retention</small>
    </div>

    <div className={styles.segmentCard}>
      <span>Rischio perdita</span>
      <h3>{stats?.one_visit_customers || 0}</h3>
      <p>Una sola visita</p>
      <small>🟡 Da riattivare</small>
    </div>

    <div className={styles.segmentCard}>
      <span>Recupero clienti</span>
      <h3>{stats?.inactive_30_customers || 0}</h3>
      <p>Inattivi da 30 giorni</p>
      <small>🔴 Priorità</small>
    </div>

    <div className={styles.segmentCard}>
      <span>Valore generato</span>
      <h3>€{Number(stats?.total_spent || 0).toFixed(2)}</h3>
      <p>Spesa totale</p>
      <small>💰 Revenue</small>
    </div>
  </div>
</section>

<section className={styles.segmentSection}>
  <div className={styles.sectionHead}>
    <div>
      <p className={styles.eyebrow}>Top spender</p>
      <h2>Clienti più profittevoli</h2>
    </div>
    <p>I clienti che hanno generato più valore nel tuo locale.</p>
  </div>

  <div className={styles.segmentGrid}>
    {(stats?.top_spenders || []).length === 0 ? (
      <div className={styles.segmentCard}>
        <span>Nessun dato</span>
        <h3>0</h3>
        <p>Non ci sono ancora top spender.</p>
        <small>💰 In attesa dati</small>
      </div>
    ) : (
      stats.top_spenders.map((customer: any, index: number) => (
        <div key={customer.user_id} className={styles.segmentCard}>
          <span>#{index + 1} Top spender</span>
          <h3>{customer.customer_code || customer.user_id}</h3>
          <p>€{Number(customer.total_spent || 0).toFixed(2)} spesi</p>
          <small>
            {customer.visits} visite · media €{Number(customer.avg_spent || 0).toFixed(2)}
          </small>
        </div>
      ))
    )}
  </div>
</section>

      <section className={styles.segmentSection}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Segmenti</p>
            <h2>Filtra i clienti</h2>
          </div>
          <p>
            Ogni segmento può diventare una missione automatica o una promo
            personalizzata.
          </p>
        </div>

        <div className={styles.segmentGrid}>
          {segments.map((segment) => (
            <button
              key={segment.key}
              className={`${styles.segmentCard} ${
                activeSegment === segment.key ? styles.active : ""
              }`}
              onClick={() => {
                setActiveSegment(segment.key);
                setActiveAction(null);
                setSuccessMessage("");
              }}
            >
              <span>{segment.metric}</span>
              <h3>{segment.title}</h3>
              <p>{segment.subtitle}</p>
              <small>{segment.action}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.clientsPanel}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Lista clienti</p>
              <h2>{activeSegmentData?.title}</h2>
            </div>
            <p>{filteredClients.length} clienti trovati</p>
          </div>

          <div className={styles.recommendationCard}>
            <div>
              <strong>Azione consigliata</strong>
              <p>
                {highRiskCount > 0
                  ? `${highRiskCount} clienti sono ad alto rischio abbandono. Consiglio: missione weekly con reward automatica max 3 GUFO.`
                  : "Il segmento è stabile. Consiglio: promo mirata per aumentare la spesa media."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveAction("missione");
                setSuccessMessage("");
              }}
            >
              Prepara azione
            </button>
          </div>

          <div className={styles.filterToolbar}>
            <label>
              Cerca cliente
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Es. GUFO-915728"
              />
            </label>

            <label>
              Rischio abbandono
              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
                }
              >
                <option value="all">Tutti</option>
                <option value="low">Basso rischio</option>
                <option value="medium">Medio rischio</option>
                <option value="high">Alto rischio</option>
              </select>
            </label>

            <label>
              Ordina per
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortBy)}
              >
                <option value="recenti">Più recenti</option>
                <option value="meno_recenti">Meno recenti</option>
                <option value="spesa_media">Spesa media più alta</option>
                <option value="spesa_mensile">Spesa mensile nel locale</option>
              </select>
            </label>
          </div>

          <div className={styles.clientsList}>
            {!loading && filteredClients.length === 0 && (
              <div className={styles.emptyBox}>
                Nessun cliente trovato con questi filtri.
              </div>
            )}

            {filteredClients.map((client) => (
              <article key={client.id} className={styles.clientCard}>
                <div>
                  <h3>{client.code}</h3>
                  <p>{client.label}</p>
                  <small>{getRiskLabel(client.returnProbability)}</small>
                </div>

                <div className={styles.clientStats}>
                  <span>{client.visits} visite</span>
                  <span>€{client.totalSpent}</span>
                  <span>Media €{client.averageSpent}</span>
                  <span>Mese €{client.monthlySpent}</span>
                  <span>{client.favoriteTime}</span>
                  <span>{client.lastVisit}</span>
                  <span>{client.returnProbability}% ritorno</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.aiPanel}>
          <p className={styles.eyebrow}>GUFO AI Marketing</p>
          <h2>Azioni automatiche</h2>

          <p className={styles.aiText}>
            GUFO AI può generare missioni e promo personalizzate per il segmento
            selezionato.
          </p>

          <div className={styles.aiSuggestion}>
            <strong>Suggerimento AI</strong>
            <p>
              {aiSuggestion ||
          `Per il segmento “${activeSegmentData?.title}” puoi lanciare una promo con cashback extra valida per 72 ore.`}
            </p>
          </div>

          <div className={styles.actionGrid}>
            <button
              type="button"
              onClick={() => {
                setActiveAction("missione");
                setSuccessMessage("");
              }}
            >
              Genera missione
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAction("promo");
                setSuccessMessage("");
              }}
            >
              Promo personalizzata
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAction("cashback");
                setSuccessMessage("");
              }}
            >
              Cashback temporaneo
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAction("notifica");
                setSuccessMessage("");
              }}
            >
              Notifica AI
            </button>
          </div>

          {successMessage && (
            <div className={styles.successBox}>{successMessage}</div>
          )}

          {activeAction === "missione" && (
            <div className={styles.formCard}>
              <h3>Genera missione automatica</h3>
              <p>Target selezionato: {activeSegmentData?.title}</p>

              <label>
                Nome missione
                <input
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              placeholder="Es. Torna entro 72 ore"
              />
              </label>

              <label>
                Tipo missione
                <select
                value={missionType}
                onChange={(e) =>
                setMissionType(e.target.value as "daily" | "weekly" | "monthly")
                }
                 >
                  <option value="daily">Daily - max 1 GUFO</option>
                  <option value="weekly">Weekly - max 3 GUFO</option>
                  <option value="monthly">Monthly - max 5 GUFO</option>
                </select>
              </label>

              <label>
                Obiettivo missione
                <select defaultValue="return">
                  <option value="return">Far tornare il cliente</option>
                  <option value="increase_spend">Aumentare la spesa media</option>
                  <option value="time_slot">Riempire fascia oraria</option>
                  <option value="inactive">Recuperare clienti inattivi</option>
                  <option value="vip">Premiare clienti top</option>
                </select>
              </label>

              <label>
                Spesa minima
                <input
                type="number"
                min="1"
                value={missionMinSpend}
                onChange={(e) => setMissionMinSpend(e.target.value)}
                placeholder="Minimo 1€"
                />
              </label>

              <label>
                Fascia oraria
                <select defaultValue="all_day">
                  <option value="all_day">Tutto il giorno</option>
                  <option value="morning">Mattina 07:00 - 11:00</option>
                  <option value="lunch">Pranzo 11:00 - 15:00</option>
                  <option value="afternoon">Pomeriggio 15:00 - 18:00</option>
                  <option value="evening">Sera 18:00 - 23:00</option>
                </select>
              </label>

              <label>
                Durata missione
                <select defaultValue="72h">
                  <option value="24h">24 ore</option>
                  <option value="72h">72 ore</option>
                  <option value="7d">7 giorni</option>
                  <option value="30d">30 giorni</option>
                </select>
              </label>

              <div className={styles.logicBox}>
                <strong>Reward automatica GUFO AI</strong>
                <p>
                  La reward viene generata automaticamente dal sistema in base
                  alla logica GUFO, alla spesa minima, al segmento e al tipo di
                  missione selezionato.
                </p>

                <ul className={styles.logicList}>
                  <li>Daily → massimo 1 GUFO</li>
                  <li>Weekly → massimo 3 GUFO</li>
                  <li>Monthly → massimo 5 GUFO</li>
                  <li>Spesa minima → 2€</li>
                </ul>
              </div>

              <button
             type="button"
             className={styles.confirmButton}
             onClick={createMissionFromAI}
>
             Genera missione automatica
            </button>
            </div>
          )}

          {activeAction === "promo" && (
            <div className={styles.formCard}>
              <h3>Promo personalizzata</h3>
              <p>Promo dedicata al segmento: {activeSegmentData?.title}</p>

              <label>
                Titolo promo
                <input placeholder="Es. Promo pranzo speciale" />
              </label>

              <label>
                Messaggio promo
                <textarea placeholder="Es. Torna questa settimana e ricevi cashback extra sul tuo prossimo acquisto." />
              </label>

              <label>
                Beneficio
                <input placeholder="Es. Aperitivo omaggio, coupon, vantaggio VIP..." />
              </label>

              <label>
                Validità
                <select defaultValue="72h">
                  <option value="today">Solo oggi</option>
                  <option value="72h">72 ore</option>
                  <option value="7d">7 giorni</option>
                  <option value="weekend">Questo weekend</option>
                </select>
              </label>

              <button
                type="button"
                className={styles.confirmButton}
                onClick={() =>
                  handleActionSuccess(
                    "Promo personalizzata salvata correttamente."
                  )
                }
              >
                Salva promo
              </button>
            </div>
          )}

          {activeAction === "cashback" && (
            <div className={styles.formCard}>
              <h3>Cashback temporaneo</h3>
              <p>Imposta cashback extra per: {activeSegmentData?.title}</p>

              <label>
                Cashback extra %
                <input type="number" min="0" max="30" placeholder="Es. 5" />
              </label>

              <label>
                Fascia oraria
                <select defaultValue="all_day">
                  <option value="all_day">Tutto il giorno</option>
                  <option value="morning">Mattina 07:00 - 11:00</option>
                  <option value="lunch">Pranzo 11:00 - 15:00</option>
                  <option value="afternoon">Pomeriggio 15:00 - 18:00</option>
                  <option value="evening">Sera 18:00 - 23:00</option>
                </select>
              </label>

              <label>
                Durata
                <select defaultValue="72h">
                  <option value="24h">24 ore</option>
                  <option value="72h">72 ore</option>
                  <option value="7d">7 giorni</option>
                </select>
              </label>

              <button
                type="button"
                className={styles.confirmButton}
                onClick={() =>
                  handleActionSuccess(
                    "Cashback temporaneo attivato correttamente."
                  )
                }
              >
                Attiva cashback
              </button>
            </div>
          )}

          {activeAction === "notifica" && (
            <div className={styles.formCard}>
              <h3>Notifica AI</h3>
              <p>
                Invia una notifica intelligente ai clienti nel segmento:{" "}
                {activeSegmentData?.title}
              </p>

              <label>
                Titolo notifica
                <input placeholder="Es. Offerta speciale vicino a te" />
              </label>

              <label>
                Messaggio
                <textarea placeholder="Es. Sei vicino al nostro locale: passa oggi e ricevi cashback extra." />
              </label>

              <label>
                Tipo invio
                <select defaultValue="manual">
                  <option value="manual">Manuale</option>
                  <option value="nearby">Quando il cliente è in zona</option>
                  <option value="lunch">Durante fascia pranzo</option>
                  <option value="evening">Durante fascia sera</option>
                </select>
              </label>

              <button
                type="button"
                className={styles.confirmButton}
                onClick={() =>
                  handleActionSuccess(
                    "Notifica AI preparata per gli utenti selezionati."
                  )
                }
              >
                Prepara notifica
              </button>
            </div>
          )}

          <div className={styles.historyBox}>
            <strong>Storico azioni</strong>
            <ul>
              <li>Promo pranzo inviata a clienti fascia 12:00 - 14:00</li>
              <li>Missione weekly preparata per clienti inattivi</li>
              <li>Cashback temporaneo suggerito per clienti in zona</li>
            </ul>
          </div>

          <div className={styles.premiumBox}>
            <strong>Funzione Premium</strong>
            <p>
              Questa sezione può essere riservata ai partner premium con fee al
              3%, analytics avanzate e AI marketing.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}