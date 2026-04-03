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
      <div className="missionGlow missionGlowA" />
      <div className="missionGlow missionGlowB" />
      <div className="missionGlow missionGlowC" />

      <div className="missionHeader">
        <div className="missionHeaderLeft">
          <div className="missionKicker">GUFO MISSIONS</div>
          <h2 className="missionTitle">Missioni attive</h2>
          <p className="missionSubtitle">
            Completa le missioni, aumenta l’attività e sblocca reward extra
            nel tuo ecosistema GUFO.
          </p>
        </div>

        <div className="missionHeaderBadge">
          <span className="missionHeaderBadgeDot" />
          Layer missioni online
        </div>
      </div>

      <div className="missionRecapGrid">
        <div className="missionRecapCard">
          <span className="missionRecapLabel">Missioni attive</span>
          <strong className="missionRecapValue">{activeCount}</strong>
          <div className="missionRecapLine missionRecapBlue" />
        </div>

        <div className="missionRecapCard">
          <span className="missionRecapLabel">Completate</span>
          <strong className="missionRecapValue">{completedCount}</strong>
          <div className="missionRecapLine missionRecapGreen" />
        </div>

        <div className="missionRecapCard">
          <span className="missionRecapLabel">Reward potenziale</span>
          <strong className="missionRecapValue">+{totalPotentialReward} GUFO</strong>
          <div className="missionRecapLine missionRecapPurple" />
        </div>

        <div className="missionRecapCard">
          <span className="missionRecapLabel">Partner esplorati</span>
          <strong className="missionRecapValue">{uniquePartners}</strong>
          <div className="missionRecapLine missionRecapPink" />
        </div>
      </div>

      <div className="missionGrid">
        {missions.map((mission) => {
          const progressPercent =
            mission.total > 0 ? Math.min((mission.progress / mission.total) * 100, 100) : 0;

          const completed = mission.progress >= mission.total;

          return (
            <div
              key={mission.id}
              className={`missionCard ${completed ? "completed" : ""}`}
            >
              <div className="missionCardTop">
                <span className={`missionBadge ${getMissionTypeClass(mission.type)}`}>
                  {getMissionTypeLabel(mission.type)}
                </span>

                <span className="missionReward">{mission.reward}</span>
              </div>

              <h3 className="missionCardTitle">{mission.title}</h3>

              <p className="missionCardDescription">{mission.description}</p>

              <div className="missionMetaRow">
                <div className="missionMetaBox">
                  <span>Stato</span>
                  <strong>{completed ? "Completata" : "In corso"}</strong>
                </div>

                <div className="missionMetaBox">
                  <span>Progresso</span>
                  <strong>
                    {mission.progress}/{mission.total}
                  </strong>
                </div>
              </div>

              <div className="missionProgressShell">
                <div className="missionProgressTrack">
                  <div
                    className="missionProgressBar"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className={`missionProgressText ${completed ? "done" : ""}`}>
                {completed
                  ? "Missione completata"
                  : `Avanzamento ${Math.round(progressPercent)}%`}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .missionSection {
          position: relative;
          z-index: 2;
          overflow: hidden;
          margin: 24px 0;
          padding: 26px;
          border-radius: 28px;
          border: 1px solid rgba(220, 225, 255, 0.16);
          background:
            linear-gradient(180deg, rgba(15, 18, 58, 0.58), rgba(10, 12, 38, 0.48));
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 16px 40px rgba(0, 0, 0, 0.28),
            0 0 28px rgba(90, 127, 255, 0.1);
        }

        .missionSection::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.06),
              rgba(255, 255, 255, 0.015) 32%,
              transparent 70%
            );
        }

        .missionGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(38px);
          pointer-events: none;
          opacity: 0.42;
        }

        .missionGlowA {
          top: -20px;
          right: 12%;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
        }

        .missionGlowB {
          bottom: -30px;
          left: 4%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.16), transparent 70%);
        }

        .missionGlowC {
          top: 42%;
          left: 44%;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.14), transparent 70%);
        }

        .missionHeader {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 20px;
        }

        .missionHeaderLeft {
          min-width: 0;
        }

        .missionKicker {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          margin-bottom: 14px;
          border-radius: 999px;
          background: rgba(109, 140, 255, 0.14);
          border: 1px solid rgba(109, 140, 255, 0.22);
          color: #d8e8ff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .missionTitle {
          margin: 0;
          font-size: 2rem;
          line-height: 1;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.03em;
          text-shadow:
            0 0 14px rgba(56, 189, 248, 0.1),
            0 0 22px rgba(139, 92, 246, 0.08);
        }

        .missionSubtitle {
          margin: 10px 0 0;
          max-width: 720px;
          color: rgba(255, 255, 255, 0.76);
          font-size: 0.98rem;
          line-height: 1.6;
        }

        .missionHeaderBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: #eef2ff;
          font-size: 0.82rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .missionHeaderBadgeDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(180deg, #4ade80, #22c55e);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
        }

        .missionRecapGrid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .missionRecapCard {
          position: relative;
          overflow: hidden;
          padding: 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.03),
            0 8px 20px rgba(0, 0, 0, 0.14);
        }

        .missionRecapLabel {
          display: block;
          margin-bottom: 10px;
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.62);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .missionRecapValue {
          display: block;
          font-size: 1.26rem;
          font-weight: 900;
          color: #ffffff;
          word-break: break-word;
        }

        .missionRecapLine {
          margin-top: 12px;
          height: 4px;
          border-radius: 999px;
        }

        .missionRecapBlue {
          background: linear-gradient(90deg, #38bdf8, #60a5fa);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.18);
        }

        .missionRecapGreen {
          background: linear-gradient(90deg, #22c55e, #4ade80);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.16);
        }

        .missionRecapPurple {
          background: linear-gradient(90deg, #8b5cf6, #a855f7);
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.16);
        }

        .missionRecapPink {
          background: linear-gradient(90deg, #ec4899, #f472b6);
          box-shadow: 0 0 12px rgba(236, 72, 153, 0.16);
        }

        .missionGrid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .missionCard {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          padding: 18px;
          background:
            linear-gradient(
              135deg,
              rgba(109, 72, 255, 0.18),
              rgba(46, 168, 255, 0.12)
            );
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 14px 24px rgba(0, 0, 0, 0.16);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .missionCard::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0.015) 34%,
            transparent 72%
          );
        }

        .missionCard:hover {
          transform: translateY(-4px);
          box-shadow:
            0 14px 28px rgba(0, 0, 0, 0.22),
            0 0 18px rgba(96, 165, 250, 0.08);
        }

        .missionCard.completed {
          background:
            linear-gradient(
              135deg,
              rgba(34, 197, 94, 0.16),
              rgba(56, 189, 248, 0.14)
            );
          border-color: rgba(74, 222, 128, 0.28);
        }

        .missionCardTop {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .missionBadge {
          font-size: 0.74rem;
          padding: 7px 11px;
          border-radius: 999px;
          font-weight: 800;
          border: 1px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .missionBadge.daily {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(96, 165, 250, 0.34);
          color: #dbeafe;
        }

        .missionBadge.weekly {
          background: rgba(168, 85, 247, 0.18);
          border-color: rgba(192, 132, 252, 0.34);
          color: #f3e8ff;
        }

        .missionBadge.monthly {
          background: rgba(16, 185, 129, 0.18);
          border-color: rgba(52, 211, 153, 0.34);
          color: #d1fae5;
        }

        .missionReward {
          position: relative;
          z-index: 1;
          font-weight: 900;
          color: #ffffff;
          text-shadow: 0 0 10px rgba(139, 92, 246, 0.14);
        }

        .missionCardTitle {
          position: relative;
          z-index: 1;
          margin: 0 0 8px;
          color: #ffffff;
          font-size: 1.08rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .missionCardDescription {
          position: relative;
          z-index: 1;
          margin: 0 0 14px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .missionMetaRow {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .missionMetaBox {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .missionMetaBox span {
          display: block;
          margin-bottom: 6px;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.62);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .missionMetaBox strong {
          font-size: 0.94rem;
          color: #ffffff;
          font-weight: 800;
          word-break: break-word;
        }

        .missionProgressShell {
          position: relative;
          z-index: 1;
        }

        .missionProgressTrack {
          height: 10px;
          width: 100%;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.16);
        }

        .missionProgressBar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #8b5cf6, #38bdf8, #60a5fa);
          transition: width 0.32s ease;
          box-shadow: 0 0 14px rgba(96, 165, 250, 0.18);
        }

        .missionCard.completed .missionProgressBar {
          background: linear-gradient(90deg, #22c55e, #38bdf8);
        }

        .missionProgressText {
          position: relative;
          z-index: 1;
          margin-top: 10px;
          font-size: 0.84rem;
          font-weight: 800;
          color: #ffffff;
        }

        .missionProgressText.done {
          color: #bbf7d0;
        }

        @media (max-width: 980px) {
          .missionRecapGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .missionSection {
            padding: 18px;
            border-radius: 22px;
          }

          .missionHeader {
            flex-direction: column;
            align-items: flex-start;
          }

          .missionTitle {
            font-size: 1.5rem;
          }

          .missionSubtitle {
            font-size: 0.92rem;
          }

          .missionGrid {
            grid-template-columns: 1fr;
          }

          .missionMetaRow {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .missionRecapGrid {
            grid-template-columns: 1fr;
          }

          .missionRecapValue {
            font-size: 1.12rem;
          }

          .missionCard {
            padding: 16px;
          }
        }
      `}</style>
    </section>
  );
}