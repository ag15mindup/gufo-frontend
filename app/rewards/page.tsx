export default function RewardsPage() {
  const rewards = [
    {
      level: "Basic",
      spending: "0 - 99€",
      cashback: "2%",
      benefits: [
        "Accesso base alla piattaforma",
        "Cashback standard",
        "Status iniziale",
      ],
    },
    {
      level: "Bronze",
      spending: "100 - 499€",
      cashback: "3%",
      benefits: [
        "Cashback migliorato",
        "Prime offerte partner",
        "Accesso a più vantaggi",
      ],
    },
    {
      level: "Silver",
      spending: "500 - 999€",
      cashback: "4%",
      benefits: [
        "Cashback più alto",
        "Promozioni dedicate",
        "Vantaggi su partner selezionati",
      ],
    },
    {
      level: "Gold",
      spending: "1000 - 2499€",
      cashback: "5%",
      benefits: [
        "Cashback premium",
        "Offerte esclusive",
        "Accesso anticipato a promo",
      ],
    },
    {
      level: "Platinum",
      spending: "2500 - 4999€",
      cashback: "6%",
      benefits: [
        "Cashback avanzato",
        "Reward speciali",
        "Priorità su vantaggi partner",
      ],
    },
    {
      level: "VIP",
      spending: "5000 - 9999€",
      cashback: "7%",
      benefits: [
        "Cashback VIP",
        "Promozioni top tier",
        "Esperienze premium",
      ],
    },
    {
      level: "Elite",
      spending: "10000 - 49999€",
      cashback: "7%",
      benefits: [
        "Cashback Elite",
        "Servizi esclusivi",
        "Reward dedicate",
      ],
    },
    {
      level: "Millionaire",
      spending: "oltre 50000€",
      cashback: "5%",
      benefits: [
        "Massimo cashback",
        "Esperienze luxury",
        "Servizi e vantaggi top level",
      ],
    },
  ];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Rewards GUFO</h1>
      <p>Scopri i vantaggi disponibili per ogni livello membership.</p>

      <div style={{ marginTop: "30px" }}>
        {rewards.map((reward: any) => (
          <div
            key={reward.level}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              backgroundColor: "#ffffff",
            }}
          >
            <h3>{reward.level}</h3>
            <p>Spesa: {reward.spending}</p>
            <p>Cashback: {reward.cashback}</p>

            <ul>
              {reward.benefits.map((benefit: any, index: number) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}