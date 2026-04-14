"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./dashboardMissions.module.css";

const supabase = createClient();

type MissionType = "daily" | "weekly" | "monthly";

type Mission = {
  id: string | number;
  mission_id?: string | number;
  code?: string;
  title: string;
  description?: string | null;
  type: MissionType;
  progress?: number | string | null;
  target?: number | string | null;
  completed?: boolean | null;
  reward_claimed?: boolean | null;
  reward_given?: number | string | null;
  reward_tx_id?: string | number | null;
  reward_percent?: number | string | null;
  reward_cap?: number | string | null;
  min_spend?: number | string | null;
  period_key?: string | null;
};

type ApiMission = Record<string, any>;

function toNumberSafe(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeMissionType(value: unknown): MissionType {
  const v = String(value || "").toLowerCase().trim();
  if (v === "daily") return "daily";
  if (v === "weekly") return "weekly";
  return "monthly";
}

function getRewardCapByType(type: MissionType) {
  if (type === "daily") return 1;
  if (type === "weekly") return 3;
  return 5;
}

function normalizeMission(raw: ApiMission): Mission {
  const type = normalizeMissionType(raw.type);

  return {
    id: raw.id ?? raw.mission_id ?? crypto.randomUUID(),
    mission_id: raw.mission_id ?? raw.id ?? null,
    code: raw.code ?? "",
    title: raw.title ?? raw.name ?? "Missione GUFO",
    description: raw.description ?? "",
    type,
    progress: raw.progress ?? 0,
    target: raw.target ?? raw.condition_value ?? 1,
    completed: raw.completed ?? false,
    reward_claimed: raw.reward_claimed ?? false,
    reward_given: raw.reward_given ?? raw.reward_gufo ?? 0,
    reward_tx_id: raw.reward_tx_id ?? null,
    reward_percent: raw.reward_percent ?? 10,
    reward_cap: raw.reward_cap ?? getRewardCapByType(type),
    min_spend: raw.min_spend ?? 1,
    period_key: raw.period_key ?? null,
  };
}

function getMissionTypeLabel(type: MissionType) {
  if (type === "daily") return "Giornaliera";
  if (type === "weekly") return "Settimanale";
  return "Mensile";
}

function getMissionTypeClass(type: MissionType) {
  if (type === "daily") return styles.daily;
  if (type === "weekly") return styles.weekly;
  return styles.monthly;
}

function getMissionProgress(mission: Mission) {
  const current = Math.max(0, toNumberSafe(mission.progress ?? 0));
  const target = Math.max(1, toNumberSafe(mission.target ?? 1, 1));
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return {
    current,
    target,
    percentage,
  };
}

function getMissionRewardCap(mission: Mission) {
  const fallback = getRewardCapByType(mission.type);
  return toNumberSafe(mission.reward_cap ?? fallback, fallback);
}

function getMissionRewardGiven(mission: Mission) {
  return toNumberSafe(mission.reward_given ?? 0);
}

function getMissionMinSpend(mission: Mission) {
  return toNumberSafe(mission.min_spend ?? 1, 1);
}

function getMissionSmartDescription(mission: Mission) {
  const minSpend = getMissionMinSpend(mission);
  const cap = getMissionRewardCap(mission);

  const code = String(mission.code || "").toLowerCase();

  if (mission.type === "daily") {
    return `Fai almeno una spesa valida da ${minSpend}€ oggi. La ricompensa viene calcolata sulla spesa più alta della giornata, fino a un massimo di ${cap} GUFO.`;
  }

  if (mission.type === "weekly" && code.includes("active")) {
    return `Completa ${toNumberSafe(
      mission.target,
      3
    )} transazioni valide nella settimana. Reward massima fino a ${cap} GUFO.`;
  }

  if (mission.type === "monthly" && code.includes("explorer")) {
    return `Visita ${toNumberSafe(
      mission.target,
      5
    )} partner diversi nel mese. Reward massima fino a ${cap} GUFO.`;
  }

  if (mission.description && mission.description.trim()) {
    return mission.description;
  }

  if (mission.type === "weekly") {
    return `Completa la missione settimanale. Reward massima fino a ${cap} GUFO.`;
  }

  return `Completa la missione mensile. Reward massima fino a ${cap} GUFO.`;
}

function getRewardChipText(mission: Mission) {
  const given = getMissionRewardGiven(mission);
  const cap = getMissionRewardCap(mission);

  if (given > 0) {
    return `+${given} GUFO`;
  }

  return `Fino a ${cap} GUFO`;
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";
}

export default function DashboardMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [claimingId, setClaimingId] = useState<string | number | null>(null);

  async function loadMissions() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error("Errore nel recupero utente");
      }

      if (!user?.id) {
        throw new Error("Utente non autenticato");
      }

      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/missions/${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Impossibile caricare le missioni"
        );
      }

      const rawMissions = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.missions)
        ? payload.missions
        : [];

      const normalized = rawMissions.map(normalizeMission).slice(0, 5);
      setMissions(normalized);
    } catch (err) {
      console.error("Errore missioni dashboard:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante il caricamento missioni"
      );
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimReward(missionId: string | number) {
    try {
      setClaimingId(missionId);
      setError("");
      setSuccessMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error("Errore nel recupero utente");
      }

      if (!user?.id) {
        throw new Error("Utente non autenticato");
      }

      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/missions/reward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          missionId,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Impossibile riscattare il reward"
        );
      }

      const rewardValue = toNumberSafe(payload?.reward_gufo ?? 0);

      setSuccessMessage(
        rewardValue > 0
          ? `Reward riscattato con successo: +${rewardValue} GUFO`
          : "Reward riscattato con successo"
      );

      await loadMissions();
    } catch (err) {
      console.error("Errore riscatto reward:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante il riscatto reward"
      );
    } finally {
      setClaimingId(null);
    }
  }

  useEffect(() => {
    loadMissions();
  }, []);

  const completedCount = useMemo(() => {
    return missions.filter((mission) => mission.completed).length;
  }, [missions]);

  return (
    <section className={styles.wrap}>
      <div className={styles.backGlowA} />
      <div className={styles.backGlowB} />
      <div className={styles.backGlowC} />

      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Mission Control</div>
          <h2 className={styles.title}>Missioni attive</h2>
          <p className={styles.subtitle}>
            Completa azioni reali, sblocca GUFO extra e aumenta il coinvolgimento
            nell’ecosistema.
          </p>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Missioni visibili</span>
            <strong className={styles.statValue}>{missions.length}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Completate</span>
            <strong className={styles.statValue}>{completedCount}</strong>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className={styles.successBox}>{successMessage}</div>
      ) : null}

      {error ? (
        <div className={styles.errorBox}>
          <span>{error}</span>
          <button className={styles.retryButton} onClick={loadMissions}>
            Riprova
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className={styles.loadingGrid}>
          {[...Array(3)].map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonTop} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
              <div className={styles.skeletonBar} />
            </div>
          ))}
        </div>
      ) : missions.length === 0 ? (
        <div className={styles.emptyBox}>
          <h3>Nessuna missione attiva</h3>
          <p>
            Quando il sistema assegnerà nuove missioni, le vedrai qui dentro in
            formato premium.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {missions.map((mission) => {
            const { current, target, percentage } = getMissionProgress(mission);
            const completed = Boolean(mission.completed);
            const rewardGiven = getMissionRewardGiven(mission);
            const rewardChipText = getRewardChipText(mission);
            const claimed = Boolean(mission.reward_claimed);
            const missionId = mission.mission_id ?? mission.id;
            const canClaim = completed && !claimed;

            return (
              <article key={String(mission.id)} className={styles.card}>
                <div className={styles.cardGlow} />

                <div className={styles.cardTop}>
                  <div className={styles.badges}>
                    <span
                      className={`${styles.typeBadge} ${getMissionTypeClass(
                        mission.type
                      )}`}
                    >
                      {getMissionTypeLabel(mission.type)}
                    </span>

                    {mission.code ? (
                      <span className={styles.codeBadge}>{mission.code}</span>
                    ) : null}
                  </div>

                  <div className={styles.rewardChip}>{rewardChipText}</div>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{mission.title}</h3>

                  <p className={styles.cardDescription}>
                    {getMissionSmartDescription(mission)}
                  </p>

                  <div className={styles.progressMeta}>
                    <span>Progresso</span>
                    <strong>
                      {current}/{target}
                    </strong>
                  </div>

                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className={styles.footerRow}>
                    <div className={styles.statusArea}>
                      {claimed ? (
                        <span className={`${styles.statusBadge} ${styles.claimed}`}>
                          Reward riscattata
                        </span>
                      ) : completed ? (
                        <span className={`${styles.statusBadge} ${styles.completed}`}>
                          {rewardGiven > 0
                            ? `Completata · +${rewardGiven} GUFO`
                            : "Completata"}
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.active}`}>
                          In corso
                        </span>
                      )}
                    </div>

                    {canClaim ? (
                      <button
                        className={styles.claimButton}
                        onClick={() => handleClaimReward(missionId)}
                        disabled={claimingId === missionId}
                      >
                        {claimingId === missionId
                          ? "Riscatto..."
                          : "Riscatta reward"}
                      </button>
                    ) : (
                      <button className={styles.disabledButton} disabled>
                        {claimed
                          ? "Già riscattata"
                          : completed
                          ? "Pronta"
                          : "Continua"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}