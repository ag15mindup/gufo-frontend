"use client";

import styles from "./Missioncard.module.css";

type Transaction = {
  id?: string;
  type?: string;
  tipo?: string;
  merchant_name?: string;
  benefit?: string;
  merchant?: string;
  raw?: any;
};

type Mission = {
  id: number;
  title: string;
  description: string;
  reward: string;
  rewardValue: number;
  type: "daily" | "weekly" | "monthly";
  progress: number;
  total: number;
};

type MissionCardProps = {
  transactions?: Transaction[];
};

function getMissionTypeLabel(type: Mission["type"]) {
  if (type === "daily") return "Giornaliera";
  if (type === "weekly") return "Settimanale";
  return "Mensile";
}

function getMissionTypeClass(type: Mission["type"]) {
  if (type === "daily") return styles.daily;
  if (type === "weekly") return styles.weekly;
  return styles.monthly;
}

function getTransactionMerchant(tx: Transaction) {
  return (
    tx?.merchant_name ??
    tx?.benefit ??
    tx?.merchant ??
    tx?.raw?.merchant_name ??
    tx?.raw?.benefit ??
    tx?.raw?.merchant ??
    "Partner GUFO"
  );
}

function getTransactionType(tx: Transaction) {
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "cashback";
}

function buildDynamicMissions(transactions: Transaction[]): Mission[] {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const merchantCount: Record<string, number> = {};
  const merchantSet = new Set<string>();

  safeTransactions.forEach((tx) => {
    const name = String(getTransactionMerchant(tx)).trim();
    if (!name) return;
    merchantSet.add(name);
    merchantCount[name] = (merchantCount[name] || 0) + 1;
  });

  const merchants = Array.from(merchantSet);

  const mostUsed = [...merchants].sort(
    (a, b) => (merchantCount[b] || 0) - (merchantCount[a] || 0)
  )[0];

  const totalTransactions = safeTransactions.length;
  const uniquePartners = merchants.length;

  const paymentLikeTransactions = safeTransactions.filter((tx) => {
    const type = String(getTransactionType(tx)).toLowerCase();
    return (
      type === "payment" ||
      type === "buy" ||
      type === "acquisto" ||
      type === "cashback"
    );
  });

  const hasAnyTransaction = paymentLikeTransactions.length > 0;
  const returnedToPartner = mostUsed ? (merchantCount[mostUsed] || 0) >= 2 : false;
  const hasExplorerProgress = uniquePartners > 0;

  return [
    {
      id: 1,
      title: "Usa GUFO oggi",
      description: "Completa almeno una transazione con il tuo account GUFO.",
      reward: "+3 GUFO",
      rewardValue: 3,
      type: "daily",
      progress: hasAnyTransaction ? 1 : 0,
      total: 1,
    },
    {
      id: 2,
      title: mostUsed ? `Torna da ${mostUsed}` : "Torna da un partner",
      description: "Effettua un nuovo acquisto nel partner che frequenti di più.",
      reward: "+5 GUFO",
      rewardValue: 5,
      type: "weekly",
      progress: returnedToPartner ? 1 : 0,
      total: 1,
    },
    {
      id: 3,
      title: "Esplora nuovi partner",
      description: "Visita partner diversi per ampliare il tuo percorso GUFO.",
      reward: "+6 GUFO",
      rewardValue: 6,
      type: "weekly",
      progress: hasExplorerProgress ? Math.min(uniquePartners, 3) : 0,
      total: 3,
    },
    {
      id: 4,
      title: "Combo Food Experience",
      description: "Completa acquisti in almeno 2 partner diversi nella settimana.",
      reward: "+10 GUFO",
      rewardValue: 10,
      type: "weekly",
      progress: Math.min(uniquePartners, 2),
      total: 2,
    },
    {
      id: 5,
      title: "Top spender mensile",
      description: "Completa 5 transazioni nel mese per ottenere un reward extra.",
      reward: "+12 GUFO",
      rewardValue: 12,
      type: "monthly",
      progress: Math.min(totalTransactions, 5),
      total: 5,
    },
  ];
}

export default function MissionCard({
  transactions = [],
}: MissionCardProps) {
  const missions = buildDynamicMissions(transactions);

  const completedCount = missions.filter(
    (mission) => mission.progress >= mission.total
  ).length;

  const activeCount = missions.length - completedCount;

  const totalPotentialReward = missions.reduce(
    (sum, mission) => sum + mission.rewardValue,
    0
  );

  const uniquePartners = new Set(
    transactions
      .map((tx) => String(getTransactionMerchant(tx)).trim())
      .filter(Boolean)
  ).size;

  return (
    <section className={styles.missionSection}>
      <div className={styles.missionHeader}>
        <div className={styles.missionHeaderLeft}>
          <h2 className={styles.missionTitle}>Missioni attive</h2>
          <p className={styles.missionSubtitle}>
            Completa le missioni, aumenta l’attività e sblocca reward extra nel
            tuo ecosistema GUFO.
          </p>
        </div>
      </div>

      <div className={styles.missionGrid}>
        <div className={styles.missionCard}>
          <div className={styles.missionCardTop}>
            <span className={`${styles.missionBadge} ${styles.daily}`}>
              Attive
            </span>
            <span className={styles.missionReward}>{activeCount}</span>
          </div>
          <h3 className={styles.missionCardTitle}>Missioni disponibili</h3>
          <p className={styles.missionCardDescription}>
            Numero di missioni ancora da completare.
          </p>
        </div>

        <div className={`${styles.missionCard} ${styles.completed}`}>
          <div className={styles.missionCardTop}>
            <span className={`${styles.missionBadge} ${styles.monthly}`}>
              Fatte
            </span>
            <span className={styles.missionReward}>{completedCount}</span>
          </div>
          <h3 className={styles.missionCardTitle}>Missioni completate</h3>
          <p className={styles.missionCardDescription}>
            Traguardi già raggiunti nel tuo percorso GUFO.
          </p>
        </div>

        <div className={styles.missionCard}>
          <div className={styles.missionCardTop}>
            <span className={`${styles.missionBadge} ${styles.weekly}`}>
              Reward
            </span>
            <span className={styles.missionReward}>+{totalPotentialReward} GUFO</span>
          </div>
          <h3 className={styles.missionCardTitle}>Reward potenziale</h3>
          <p className={styles.missionCardDescription}>
            Valore massimo ottenibile completando tutte le missioni.
          </p>
        </div>

        <div className={styles.missionCard}>
          <div className={styles.missionCardTop}>
            <span className={`${styles.missionBadge} ${styles.daily}`}>
              Partner
            </span>
            <span className={styles.missionReward}>{uniquePartners}</span>
          </div>
          <h3 className={styles.missionCardTitle}>Partner esplorati</h3>
          <p className={styles.missionCardDescription}>
            Numero di partner distinti con cui hai interagito.
          </p>
        </div>
      </div>

      <div className={styles.missionGrid} style={{ marginTop: 18 }}>
        {missions.map((mission) => {
          const progressPercent =
            mission.total > 0
              ? Math.min((mission.progress / mission.total) * 100, 100)
              : 0;

          const completed = mission.progress >= mission.total;

          return (
            <div
              key={mission.id}
              className={`${styles.missionCard} ${
                completed ? styles.completed : ""
              }`}
            >
              <div className={styles.missionCardTop}>
                <span
                  className={`${styles.missionBadge} ${getMissionTypeClass(
                    mission.type
                  )}`}
                >
                  {getMissionTypeLabel(mission.type)}
                </span>

                <span className={styles.missionReward}>{mission.reward}</span>
              </div>

              <h3 className={styles.missionCardTitle}>{mission.title}</h3>

              <p className={styles.missionCardDescription}>
                {mission.description}
              </p>

              <div className={styles.missionMetaRow}>
                <div className={styles.missionMetaBox}>
                  <span>Stato</span>
                  <strong>{completed ? "Completata" : "In corso"}</strong>
                </div>

                <div className={styles.missionMetaBox}>
                  <span>Progresso</span>
                  <strong>
                    {mission.progress}/{mission.total}
                  </strong>
                </div>
              </div>

              <div className={styles.missionProgressShell}>
                <div className={styles.missionProgressTrack}>
                  <div
                    className={styles.missionProgressBar}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className={styles.missionProgressText}>
                {completed
                  ? "Missione completata"
                  : `Avanzamento ${Math.round(progressPercent)}%`}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}