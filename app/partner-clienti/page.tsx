"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./partner-clienti.module.css";

const supabase = createClient();

type SegmentKey =
  | "all"
  | "tornati"
  | "abituali"
  | "top"
  | "one_time"
  | "inattivi";

type ActionPanel = "missione" | "promo" | "cashback" | "notifica" | null;
type SortBy = "recenti" | "meno_recenti" | "spesa_media" | "spesa_mensile";
type RiskFilter = "all" | "low" | "medium" | "high";
type MissionTemplateKey =
  | "return_72h"
  | "weekend_cashback"
  | "spend_min"
  | "three_purchases"
  | "inactive_recovery"
  | "vip_reward";

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

type AiInsight = {
  title: string;
  message: string;
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
    key: "tornati",
    title: "Clienti tornati",
    subtitle: "Hanno effettuato più visite",
    metric: "Retention attiva",
    action: "Premia",
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

function getClientAdvice(client: ClientItem | null) {
  if (!client) {
    return "Seleziona un cliente dalla lista per vedere un consiglio personalizzato.";
  }

  if (client.returnProbability < 40) {
    return "Cliente ad alto rischio: consigliata una missione di ritorno entro 72 ore con reward immediata.";
  }

  if (client.visits === 1) {
    return "Cliente entrato una sola volta: consigliata una promo di benvenuto per farlo tornare.";
  }

  if (client.totalSpent >= 50) {
    return "Cliente ad alto valore: consigliata promo VIP o cashback temporaneo dedicato.";
  }

  if (client.returnProbability >= 70) {
    return "Cliente fedele: consigliata missione premio per aumentare la frequenza.";
  }

  return "Cliente da monitorare: consigliata promo leggera per aumentare la spesa media.";
}

export default function PartnerClientiPage() {
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("all");
  const [activeAction, setActiveAction] = useState<ActionPanel>(null);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recenti");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [successMessage, setSuccessMessage] = useState("");

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);

  const [missionTitle, setMissionTitle] = useState("Cena da noi entro 72 ore");
  const [missionType, setMissionType] =
    useState<"daily" | "weekly" | "monthly">("daily");
  const [missionMinSpend, setMissionMinSpend] = useState("2");
const [missionTemplate, setMissionTemplate] =
  useState<MissionTemplateKey>("return_72h");
const [missionRewardPercent, setMissionRewardPercent] = useState("10");
const [missionConditionValue, setMissionConditionValue] = useState("1");


  const [promoTitle, setPromoTitle] = useState("Promo speciale GUFO");
  const [promoMessage, setPromoMessage] = useState(
    "Torna questa settimana e ricevi un vantaggio speciale dal partner GUFO."
  );
  const [promoBenefit, setPromoBenefit] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

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

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          setError("Sessione non valida");
          return;
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const result = await safeJsonFetch(`${apiUrl}/partner-customers/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const rawCustomers = result?.data?.customers || [];

        const clientsData: ClientItem[] = rawCustomers.map((customer: any) => ({
          id: customer.user_id,
          code: customer.customer_code || customer.user_id,
          segment:
            customer.segment === "regular"
              ? "abituali"
              : customer.segment === "one_visit"
              ? "one_time"
              : customer.segment === "inactive_30"
              ? "inattivi"
              : customer.segment === "top"
              ? "top"
              : "tornati",
          label: `${customer.visits || 0} visite · ${
            customer.days_since_last_visit ?? 0
          } giorni dall’ultima visita`,
          visits: Number(customer.visits || 0),
          totalSpent: Number(customer.total_spent || 0),
          averageSpent: Number(customer.avg_spent || 0),
          monthlySpent: Number(
            customer.monthly_spent || customer.total_spent || 0
          ),
          daysFromLastVisit: Number(customer.days_since_last_visit ?? 0),
          lastVisit: customer.last_visit
            ? new Date(customer.last_visit).toLocaleDateString("it-IT")
            : "-",
          favoriteTime: customer.favorite_time || "-",
          returnProbability:
            customer.segment === "inactive_30"
              ? 30
              : customer.segment === "one_visit"
              ? 45
              : customer.segment === "regular"
              ? 85
              : 65,
        }));

        setClients(clientsData);
        setStats(result?.data?.stats || null);
        setAiSuggestion(result?.data?.ai_suggestion || "");
        setAiInsights(result?.data?.ai_insights || []);

        if (clientsData.length > 0) {
          setSelectedClient(clientsData[0]);
        } else {
          setError("Nessun cliente trovato per questo partner");
        }
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

  const returnRate = stats?.total_customers
    ? Math.round(((stats?.regular_customers || 0) / stats.total_customers) * 100)
    : 0;

  const estimatedRecoveryValue = Number((highRiskCount * 12).toFixed(2));

  const suggestedCashback = stats?.suggested_cashback || 3;
  const suggestedMissionTemplate =
    stats?.suggested_mission_template || "Missione ritorno entro 72 ore";

  const bestDay = stats?.best_day || null;
  const bestTimeSlot = stats?.best_time_slot || null;

function applyMissionTemplate(template: MissionTemplateKey) {
  setMissionTemplate(template);

  if (template === "return_72h") {
    setMissionTitle("Torna entro 72 ore");
    setMissionType("daily");
    setMissionMinSpend("2");
    setMissionRewardPercent("10");
    setMissionConditionValue("1");
  }

  if (template === "weekend_cashback") {
    setMissionTitle("Weekend Cashback GUFO");
    setMissionType("weekly");
    setMissionMinSpend("10");
    setMissionRewardPercent("8");
    setMissionConditionValue("1");
  }

  if (template === "spend_min") {
    setMissionTitle("Spendi almeno 15€");
    setMissionType("daily");
    setMissionMinSpend("15");
    setMissionRewardPercent("10");
    setMissionConditionValue("15");
  }

  if (template === "three_purchases") {
    setMissionTitle("Effettua 3 acquisti");
    setMissionType("weekly");
    setMissionMinSpend("1");
    setMissionRewardPercent("10");
    setMissionConditionValue("3");
  }

  if (template === "inactive_recovery") {
    setMissionTitle("Ci manchi! Torna da noi");
    setMissionType("weekly");
    setMissionMinSpend("5");
    setMissionRewardPercent("12");
    setMissionConditionValue("1");
    setActiveSegment("inattivi");
  }

  if (template === "vip_reward") {
    setMissionTitle("Premio cliente VIP");
    setMissionType("monthly");
    setMissionMinSpend("20");
    setMissionRewardPercent("10");
    setMissionConditionValue("1");
    setActiveSegment("top");
  }
}

function getMissionConditionType() {
  if (missionTemplate === "spend_min") return "spend_min";
  if (missionTemplate === "three_purchases") return "transaction_count";
  return "transaction_count";
}

  async function createMissionFromAI() {
    try {
      setError("");

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

      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7);

      const response = await fetch(`${apiUrl}/missions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: missionTitle,
          description:
            aiSuggestion ||
            getClientAdvice(selectedClient) ||
            "Missione automatica generata da GUFO AI Marketing.",
          type: missionType,
          min_spend: Number(missionMinSpend),
          reward_percent: Number(missionRewardPercent),
          condition_type: getMissionConditionType(),
          condition_value: Number(missionConditionValue),
          target_segment: activeSegment,
          target_user_id: selectedClient?.id || null,
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

  async function sendPromoNotification() {
    try {
      setError("");
      setPromoLoading(true);

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

      const finalMessage = promoBenefit
        ? `${promoMessage} Beneficio: ${promoBenefit}`
        : promoMessage;

      const response = await fetch(`${apiUrl}/notifications/partner/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: promoTitle,
          message: finalMessage,
          type: "promo",
          target_segment: activeSegment,
          target_user_id: selectedClient?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Errore invio promo");
      }

      handleActionSuccess(`Promo inviata a ${data.count || 0} clienti.`);
    } catch (err: any) {
      setError(err.message || "Errore invio promo");
    } finally {
      setPromoLoading(false);
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

          <div>
            <strong>{returnRate}%</strong>
            <span>tasso ritorno</span>
          </div>

          <div>
            <strong>{highRiskCount}</strong>
            <span>clienti a rischio</span>
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
                  {customer.visits} visite · media €
                  {Number(customer.avg_spent || 0).toFixed(2)}
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
                setSelectedClient(null);
              }}
              type="button"
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
                  ? `${highRiskCount} clienti sono ad alto rischio abbandono. Se ne recuperi anche solo il 25%, puoi generare circa €${estimatedRecoveryValue} di vendite aggiuntive. Consiglio: missione weekly con reward max 3 GUFO.`
                  : "Il segmento è stabile. Consiglio: promo mirata per aumentare la spesa media o premiare i clienti più fedeli."}
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
              <article
                key={client.id}
                className={`${styles.clientCard} ${
                  selectedClient?.id === client.id ? styles.active : ""
                }`}
                onClick={() => setSelectedClient(client)}
              >
                <div>
                  <h3>{client.code}</h3>
                  <p>{client.label}</p>
                  <small>{getRiskLabel(client.returnProbability)}</small>
                </div>

                <div className={styles.clientStats}>
                  <span>{client.visits} visite</span>
                  <span>€{client.totalSpent.toFixed(2)}</span>
                  <span>Media €{client.averageSpent.toFixed(2)}</span>
                  <span>Mese €{client.monthlySpent.toFixed(2)}</span>
                  <span>{client.favoriteTime}</span>
                  <span>{client.lastVisit}</span>
                  <span>{client.returnProbability}% ritorno</span>
                </div>

                <div className={styles.quickClientActions}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedClient(client);
                      setActiveAction("missione");
                    }}
                  >
                    🎯 Missione
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedClient(client);
                      setActiveAction("promo");
                    }}
                  >
                    📢 Promo
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedClient(client);
                      setActiveAction("notifica");
                    }}
                  >
                    🔔 Notifica
                  </button>
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

<div className={styles.segmentGrid}>
  <div className={styles.segmentCard}>
    <span>Cashback consigliato</span>
    <h3>{suggestedCashback}%</h3>
    <p>Percentuale consigliata da GUFO AI per il prossimo test.</p>
    <small>💡 Suggerimento</small>
  </div>

  <div className={styles.segmentCard}>
    <span>Missione consigliata</span>
    <h3>{suggestedMissionTemplate}</h3>
    <p>Template più adatto in base ai dati clienti.</p>
    <small>🎯 Azione</small>
  </div>

  <div className={styles.segmentCard}>
    <span>Giorno migliore</span>
    <h3>{bestDay?.day || "-"}</h3>
    <p>
      {bestDay
        ? `${bestDay.count} vendite · €${bestDay.amount}`
        : "Servono più transazioni."}
    </p>
    <small>📅 Performance</small>
  </div>

  <div className={styles.segmentCard}>
    <span>Fascia migliore</span>
    <h3>{bestTimeSlot?.label || "-"}</h3>
    <p>
      {bestTimeSlot
        ? `${bestTimeSlot.count} vendite · €${bestTimeSlot.amount}`
        : "Servono più transazioni."}
    </p>
    <small>⏰ Orario</small>
  </div>
</div>

          <div className={styles.aiSuggestion}>
            <strong>Suggerimento AI</strong>
            <p>
              {aiSuggestion ||
                `Per il segmento “${activeSegmentData?.title}” puoi lanciare una promo con cashback extra valida per 72 ore.`}
            </p>
          </div>

<div className={styles.aiSuggestion}>
  <strong>Insight IA reali</strong>

  {aiInsights.length === 0 ? (
    <p>Nessun insight disponibile. Servono più transazioni per generare analisi.</p>
  ) : (
    <div className={styles.insightList}>
      {aiInsights.map((insight, index) => (
        <div key={`${insight.title}-${index}`} className={styles.insightCard}>
          <strong>{insight.title}</strong>
          <p>{insight.message}</p>
        </div>
      ))}
    </div>
  )}
</div>

          <div className={styles.aiSuggestion}>
            <strong>Dettaglio cliente selezionato</strong>

            {selectedClient ? (
              <>
                <h3>{selectedClient.code}</h3>
                <p>{getClientAdvice(selectedClient)}</p>

                <div className={styles.clientStats}>
                  <span>{selectedClient.visits} visite</span>
                  <span>Totale €{selectedClient.totalSpent.toFixed(2)}</span>
                  <span>Media €{selectedClient.averageSpent.toFixed(2)}</span>
                  <span>Mese €{selectedClient.monthlySpent.toFixed(2)}</span>
                  <span>Ultima visita {selectedClient.lastVisit}</span>
                  <span>{selectedClient.returnProbability}% ritorno</span>
                  <span>{getRiskLabel(selectedClient.returnProbability)}</span>
                </div>

                <div className={styles.quickClientActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("missione");
                      setSuccessMessage("");
                    }}
                  >
                    Crea missione
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("promo");
                      setSuccessMessage("");
                    }}
                  >
                    Invia promo
                  </button>
                </div>
              </>
            ) : (
              <p>Seleziona un cliente dalla lista per vedere il dettaglio.</p>
            )}
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
              <p>
                Target:{" "}
                {selectedClient
                  ? `cliente ${selectedClient.code}`
                  : activeSegmentData?.title}
              </p>

<label>
  Template missione
  <select
    value={missionTemplate}
    onChange={(e) =>
      applyMissionTemplate(e.target.value as MissionTemplateKey)
    }
  >
    <option value="return_72h">Torna entro 72 ore</option>
    <option value="weekend_cashback">Weekend Cashback</option>
    <option value="spend_min">Spendi almeno X€</option>
    <option value="three_purchases">Effettua 3 acquisti</option>
    <option value="inactive_recovery">Recupera clienti inattivi</option>
    <option value="vip_reward">Premio clienti VIP</option>
  </select>
</label>

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
                    setMissionType(
                      e.target.value as "daily" | "weekly" | "monthly"
                    )
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
  Reward percentuale
  <input
    type="number"
    min="1"
    max="30"
    value={missionRewardPercent}
    onChange={(e) => setMissionRewardPercent(e.target.value)}
    placeholder="Es. 10"
  />
</label>

<label>
  Obiettivo
  <input
    type="number"
    min="1"
    value={missionConditionValue}
    onChange={(e) => setMissionConditionValue(e.target.value)}
    placeholder="Es. 1"
  />
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
                  <li>Spesa minima → minimo 1€</li>
                </ul>
              </div>

<div className={styles.logicBox}>
  <strong>Preview missione partner</strong>
  <p>
    Il partner creerà una missione “{missionTitle}” per il target{" "}
    {selectedClient ? `cliente ${selectedClient.code}` : activeSegmentData?.title}.
  </p>
  <ul className={styles.logicList}>
    <li>Tipo: {missionType}</li>
    <li>Spesa minima: €{missionMinSpend}</li>
    <li>Reward: {missionRewardPercent}%</li>
    <li>Obiettivo: {missionConditionValue}</li>
    <li>Target segmento: {activeSegment}</li>
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
              <p>
                Target:{" "}
                {selectedClient
                  ? `cliente ${selectedClient.code}`
                  : activeSegmentData?.title}
              </p>

              <label>
                Titolo promo
                <input
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  placeholder="Es. Promo pranzo speciale"
                />
              </label>

              <label>
                Messaggio promo
                <textarea
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  placeholder="Es. Torna questa settimana e ricevi cashback extra sul tuo prossimo acquisto."
                />
              </label>

              <label>
                Beneficio
                <input
                  value={promoBenefit}
                  onChange={(e) => setPromoBenefit(e.target.value)}
                  placeholder="Es. Aperitivo omaggio, coupon, vantaggio VIP..."
                />
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
                onClick={sendPromoNotification}
                disabled={promoLoading}
              >
                {promoLoading ? "Invio promo..." : "Invia promo ai clienti"}
              </button>
            </div>
          )}

          {activeAction === "cashback" && (
            <div className={styles.formCard}>
              <h3>Cashback temporaneo</h3>
              <p>
                Target:{" "}
                {selectedClient
                  ? `cliente ${selectedClient.code}`
                  : activeSegmentData?.title}
              </p>

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
                    "Cashback temporaneo preparato correttamente."
                  )
                }
              >
                Prepara cashback
              </button>
            </div>
          )}

          {activeAction === "notifica" && (
            <div className={styles.formCard}>
              <h3>Notifica AI</h3>
              <p>
                Target:{" "}
                {selectedClient
                  ? `cliente ${selectedClient.code}`
                  : activeSegmentData?.title}
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
                    "Notifica AI preparata. Invio automatico in sviluppo per il pilot."
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
              <li>Promo pranzo inviata a clienti inattivi</li>
              <li>Missione weekly preparata per clienti abituali</li>
              <li>Cashback temporaneo suggerito per clienti top</li>
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