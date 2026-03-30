"use client";

type Mission = {
  id: number;
  title: string;
  description: string;
  reward: string;
  type: "daily" | "weekly" | "monthly";
  progress?: number;
  total?: number;
};

const demoMissions: Mission[] = [
  {
    id: 1,
    title: "Vai in un partner nuovo",
    description: "Effettua una spesa in un partner nuovo",
    reward: "+3 GUFO",
    type: "daily",
    progress: 0,
    total: 1,
  },
  {
    id: 2,
    title: "Aperitivo + Pizza",
    description: "Completa la combo settimanale",
    reward: "+5 GUFO",
    type: "weekly",
    progress: 1,
    total: 2,
  },
  {
    id: 3,
    title: "5 partner diversi",
    description: "Spendi in 5 partner diversi nel mese",
    reward: "+10 GUFO",
    type: "monthly",
    progress: 2,
    total: 5,
  },
];

function getTypeLabel(type: Mission["type"]) {
  if (type === "daily") return "Giornaliera";
  if (type === "weekly") return "Settimanale";
  return "Mensile";
}

export default function MissioniCard() {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "24px",
        padding: "20px",
        background: "rgba(10, 15, 35, 0.45)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.8rem",
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
              color: "rgba(255,255,255,0.78)",
              fontSize: "0.98rem",
            }}
          >
            Completa le missioni e guadagna reward extra
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {demoMissions.map((mission) => {
          const progress = mission.progress ?? 0;
          const total = mission.total ?? 1;
          const width = `${Math.min((progress / total) * 100, 100)}%`;

          return (
            <div
              key={mission.id}
              style={{
                borderRadius: "20px",
                padding: "16px",
                background: "linear-gradient(135deg, rgba(130,80,255,0.22), rgba(70,180,255,0.16))",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    color: "#fff",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {getTypeLabel(mission.type)}
                </span>

                <span
                  style={{
                    fontWeight: 800,
                    color: "#fff",
                    fontSize: "1rem",
                  }}
                >
                  {mission.reward}
                </span>
              </div>

              <h3
                style={{
                  margin: "0 0 6px 0",
                  color: "#fff",
                  fontSize: "1.15rem",
                  fontWeight: 800,
                }}
              >
                {mission.title}
              </h3>

              <p
                style={{
                  margin: "0 0 12px 0",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "0.95rem",
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
                    height: "100%",
                    width,
                    borderRadius: "999px",
                    background: "linear-gradient(90deg, #8b5cf6, #38bdf8)",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: "#fff",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              >
                Progresso: {progress}/{total}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}