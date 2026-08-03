"use client";

import { Brain, CheckCircle, WarningCircle, ChartLineUp } from "@phosphor-icons/react";

export default function AIModelsPage() {
  const models = [
    { name: "Deep Momentum LSTM", version: "v2.4.1", status: "Active", accuracy: "84.2%", lastTrained: "2 hours ago", mse: "0.0024" },
    { name: "Fundamental Sentiment NLP", version: "v1.9.0", status: "Active", accuracy: "79.5%", lastTrained: "5 hours ago", mse: "0.0115" },
    { name: "Volatility Autoencoder", version: "v3.0.2", status: "Degraded", accuracy: "65.1%", lastTrained: "1 day ago", mse: "0.0542" }
  ];

  return (
    <div style={{ flex: 1, padding: "2rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
         <div>
           <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0, letterSpacing: "-0.04em" }}>AI Models Hub</h1>
           <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>Monitor the performance and health of deployed proprietary models.</div>
         </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
         {models.map((model, i) => {
           const isHealthy = model.status === "Active";
           return (
             <div key={i} style={{ border: `1px solid ${isHealthy ? 'var(--color-border)' : 'var(--color-negative)'}`, borderRadius: "12px", padding: "1.5rem", backgroundColor: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                   <div>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                       <h3 style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>{model.name}</h3>
                       <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", backgroundColor: "var(--color-surface)", borderRadius: "4px", border: "1px solid var(--color-border)" }}>{model.version}</span>
                     </div>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", fontSize: "0.75rem", color: isHealthy ? "var(--color-positive)" : "var(--color-negative)", fontWeight: 500 }}>
                        {isHealthy ? <CheckCircle weight="fill" /> : <WarningCircle weight="fill" />}
                        Status: {model.status}
                     </div>
                   </div>
                   <ChartLineUp size={24} color="var(--color-text-tertiary)" />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                   <div>
                     <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Accuracy</div>
                     <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{model.accuracy}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>MSE Loss</div>
                     <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{model.mse}</div>
                   </div>
                   <div style={{ textAlign: "right" }}>
                     <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Trained</div>
                     <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>{model.lastTrained}</div>
                   </div>
                </div>

             </div>
           );
         })}
      </div>
    </div>
  );
}
