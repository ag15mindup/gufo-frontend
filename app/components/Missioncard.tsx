"use client";

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
  type: "daily" | "weekly" | "monthly";
  progress: number;
  total: number;
};

function getMissionTypeLabel(type: Mission["type"]) {
  if (type === "daily") return "Giornaliera";
  if (type === "weekly") return "Settimanale";
  return "Mensile";
}

function getMissionTypeColors(type: Mission["type"]) {
  if (type === "daily") {
    return {
      badgeBg: "rgba(59, 130, 246, 0.18)",
      badgeBorder: "rgba(96, 165, 250, 0.35)",
      badgeColor: "#dbeafe",
    };
  }

  if (type === "weekly") {
    return {
      badgeBg: "rgba(168, 85, 247, 0.18)",
      badgeBorder: "rgba(192, 132, 252, 0.35)",
      badgeColor: "#f3e8ff",
    };
  }

  return {
    badgeBg: "rgba(16, 185, 129, 0.18)",
      badgeBorder: "rgba(52, 211, 153, 0.35)",
      badgeColor: "#d1fae5",
  };
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
  const hasFoodCombo = uniquePartners >= 2;
  const hasExplorerProgress = uniquePartners > 0;

  return [
    {
      id: 1,
      title: "Usa GUFO oggi",
      description: "Completa almeno una transazione con il tuo account GUFO",
      reward: "+3 GUFO",
      type: "daily",
      progress: hasAnyTransaction ? 1 : 0,
      total: 1,
    },
    {
      id: 2,
      title: mostUsed ? `Torna da ${mostUsed}` : "Torna da un partner",
      description: "Effettua un nuovo acquisto nel partner che frequenti di più",
      reward: "+5 GUFO",
      type: "weekly",
      progress: returnedToPartner ? 1 : 0,
      total: 1,
    },
    {
      id: 3,
      title: "Esplora nuovi partner",
      description: "Visita partner diversi per ampliare il tuo percorso GUFO",
      reward: "+6 GUFO",
      type: "weekly",
      progress: hasExplorerProgress ? Math.min(uniquePartners, 3) : 0,
      total: 3,
    },
    {
      id: 4,
      title: "Combo Food Experience",
      description: "Completa acquisti in almeno 2 partner diversi nella settimana",
      reward: "+10 GUFO",
      type: "weekly",
      progress: Math.min(uniquePartners, 2),
      total: 2,
    },
    {
      id: 5,
      title: "Top spender mensile",
      description: "Completa 5 transazioni nel mese per ottenere un reward extra",
      reward: "+12 GUFO",
      type: "monthly",
      progress: Math.min(totalTransactions, 5),
      total: 5,
    },
  ];
}

type MissionCardProps = {
  transactions?: Transaction[];
};

export default function MissionCard({
  transactions = [],
}: MissionCardProps) {
  const missions = buildDynamicMissions(transactions);

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: "24px",
        padding: "20px",
        background: "rgba(10, 15, 35, 0.42)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
        position: "relative",
        zIndex: 2,
        marginBottom: "24px",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#fff",
          }}
        >
          Missioni attive
        </h2>

        <p
          style={{
            marginTop: 6,
            marginBottom: 0,
            color: "rgba(255,255,255,0.75)",
            fontSize: "0.95rem",
          }}
        >
          Completa le missioni e ottieni reward extra
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {missions.map((mission) => {
          const progressPercent =
            mission.total > 0 ? (mission.progress / mission.total) * 100 : 0;

          const completed = mission.progress >= mission.total;
          const typeColors = getMissionTypeColors(mission.type);

          return (
            <div
              key={mission.id}
              style={{
                borderRadius: "20px",
                padding: "16px",
                background: completed
                  ? "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(59,130,246,0.14))"
                  : "linear-gradient(135deg, rgba(130,80,255,0.20), rgba(70,180,255,0.16))",
                border: completed
                  ? "1px solid rgba(74, 222, 128, 0.35)"
                  : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.78rem",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: typeColors.badgeBg,
                    border: `1px solid ${typeColors.badgeBorder}`,
                    color: typeColors.badgeColor,
                    fontWeight: 700,
                  }}
                >
                  {getMissionTypeLabel(mission.type)}
                </span>

                <span
                  style={{
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  {mission.reward}
                </span>
              </div>

              <h3
                style={{
                  margin: "0 0 6px 0",
                  color: "#fff",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                }}
              >
                {mission.title}
              </h3>

              <p
                style={{
                  margin: "0 0 12px 0",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "0.9rem",
                  lineHeight: 1.4,
                }}
              >
                {mission.description}
              </p>

              <div
                style={{
                  height: "10px",
                  width: "100%",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.10)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: completed
                      ? "linear-gradient(90deg, #22c55e, #38bdf8)"
                      : "linear-gradient(90deg, #8b5cf6, #38bdf8)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: completed ? "#bbf7d0" : "#fff",
                }}
              >
                {completed
                  ? "Completata"
                  : `Progresso: ${mission.progress}/${mission.total}`}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}