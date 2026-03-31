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
  rewardValue: number;
  type: "daily" | "weekly" | "monthly";
  progress: number;
  total: number;
};

function getMissionTypeLabel(type: Mission["type"]) {
  if (type === "daily") return "Giornaliera";
  if (type === "weekly") return "Settimanale";
  return "Mensile";
}

function getMissionTypeClass(type: Mission["type"]) {
  if (type === "daily") return "daily";
  if (type === "weekly") return "weekly";
  return "monthly";
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
      description: "Completa almeno una transazione con il tuo account GUFO",
      reward: "+3 GUFO",
      rewardValue: 3,
      type: "daily",
      progress: hasAnyTransaction ? 1 : 0,
      total: 1,
    },
    {
      id: 2,
      title: mostUsed ? `Torna da ${mostUsed}` : "Torna da un partner",
      description: "Effettua un nuovo acquisto nel partner che frequenti di più",
      reward: "+5 GUFO",
      rewardValue: 5,
      type: "weekly",
      progress: returnedToPartner ? 1 : 0,
      total: 1,
    },
    {
      id: 3,
      title: "Esplora nuovi partner",
      description: "Visita partner diversi per ampliare il tuo percorso GUFO",
      reward: "+6 GUFO",
      rewardValue: 6,
      type: "weekly",
      progress: hasExplorerProgress ? Math.min(uniquePartners, 3) : 0,
      total: 3,
    },
    {
      id: 4,
      title: "Combo Food Experience",
      description: "Completa acquisti in almeno 2 partner diversi nella settimana",
      reward: "+10 GUFO",
      rewardValue: 10,
      type: "weekly",
      progress: Math.min(uniquePartners, 2),
      total: 2,
    },
    {
      id: 5,
      title: "Top spender mensile",
      description: "Completa 5 transazioni nel mese per ottenere un reward extra",
      reward: "+12 GUFO",
      rewardValue: 12,
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

  const completedCount = missions.filter(
    (mission) => mission.progress >= mission.total
  ).length;

  const activeCount = missions.length - completedCount;

  const totalPotentialReward = missions.reduce(
    (sum, mission) => sum + mission.rewardValue,
    0
  );

  const uniquePartners = new Set(
    transactions.map((tx) => String(getTransactionMerchant(tx)).trim())
  ).size;

  return (
    <section className="missionSection">
      <div className="missionHeader">
        <div>
          <h2 className="missionTitle">Missioni attive</h2>
          <p className="missionSubtitle">
            Completa le missioni e ottieni reward extra nel tuo ecosistema GUFO
          </p>
        </div>
      </div>

      <div className="missionRecapGrid">
        <div className="missionRecapCard">
          <span className="missionRecapLabel">Missioni attive</span>
          <strong className="missionRecapValue">{activeCount}</strong>
        </div>

        <div className="missionRecapCard">
          <span className="missionRecapLabel">Completate</span>
          <strong className="missionRecapValue">{completedCount}</strong>
        </div>

        <div className="missionRecapCard">
          <span className="missionRecapLabel">Reward potenziale</span>
          <strong className="missionRecapValue">+{totalPotentialReward} GUFO</strong>
        </div>

        <div className="missionRecapCard">
          <span className="missionRecapLabel">Partner esplorati</span>
          <strong className="missionRecapValue">{uniquePartners}</strong>
        </div>
      </div>

      <div className="missionGrid">
        {missions.map((mission) => {
          const progressPercent =
            mission.total > 0 ? (mission.progress / mission.total) * 100 : 0;

          const completed = mission.progress >= mission.total;

          return (
            <div
              key={mission.id}
              className={`missionCard ${completed ? "completed" : ""}`}
            >
              <div className="missionTopRow">
                <span className={`missionBadge ${getMissionTypeClass(mission.type)}`}>
                  {getMissionTypeLabel(mission.type)}
                </span>

                <span className="missionReward">{mission.reward}</span>
              </div>

              <h3 className="missionCardTitle">{mission.title}</h3>

              <p className="missionCardDescription">{mission.description}</p>

              <div className="missionProgressTrack">
                <div
                  className="missionProgressBar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className={`missionProgressText ${completed ? "done" : ""}`}>
                {completed
                  ? "Completata"
                  : `Progresso: ${mission.progress}/${mission.total}`}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .missionSection {
          position: relative;
          z-index: 2;
          margin-bottom: 24px;
          padding: 22px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(
            180deg,
            rgba(10, 18, 42, 0.72),
            rgba(8, 14, 34, 0.56)
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 14px 34px rgba(0, 0, 0, 0.28),
            0 0 24px rgba(69, 132, 255, 0.08);
        }

        .missionHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
        }

        .missionTitle {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
        }

        .missionSubtitle {
          margin-top: 6px;
          margin-bottom: 0;
          color: rgba(255, 255, 255, 0.74);
          font-size: 0.95rem;
        }

        .missionRecapGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .missionRecapCard {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .missionRecapLabel {
          display: block;
          margin-bottom: 8px;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.66);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .missionRecapValue {
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
        }

        .missionGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .missionCard {
          border-radius: 20px;
          padding: 16px;
          background: linear-gradient(
            135deg,
            rgba(130, 80, 255, 0.18),
            rgba(70, 180, 255, 0.14)
          );
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .missionCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.22);
        }

        .missionCard.completed {
          background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.16),
            rgba(59, 130, 246, 0.14)
          );
          border: 1px solid rgba(74, 222, 128, 0.3);
        }

        .missionTopRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .missionBadge {
          font-size: 0.78rem;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .missionBadge.daily {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(96, 165, 250, 0.35);
          color: #dbeafe;
        }

        .missionBadge.weekly {
          background: rgba(168, 85, 247, 0.18);
          border-color: rgba(192, 132, 252, 0.35);
          color: #f3e8ff;
        }

        .missionBadge.monthly {
          background: rgba(16, 185, 129, 0.18);
          border-color: rgba(52, 211, 153, 0.35);
          color: #d1fae5;
        }

        .missionReward {
          font-weight: 900;
          color: #fff;
        }

        .missionCardTitle {
          margin: 0 0 6px 0;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 800;
        }

        .missionCardDescription {
          margin: 0 0 12px 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .missionProgressTrack {
          height: 10px;
          width: 100%;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .missionProgressBar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #8b5cf6, #38bdf8);
          transition: width 0.3s ease;
        }

        .missionCard.completed .missionProgressBar {
          background: linear-gradient(90deg, #22c55e, #38bdf8);
        }

        .missionProgressText {
          margin-top: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
        }

        .missionProgressText.done {
          color: #bbf7d0;
        }

        @media (max-width: 900px) {
          .missionRecapGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .missionSection {
            padding: 18px;
          }

          .missionRecapGrid {
            grid-template-columns: 1fr;
          }

          .missionGrid {
            grid-template-columns: 1fr;
          }

          .missionTitle {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </section>
  );
}