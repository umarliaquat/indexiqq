"use client";

import { Gear, User, Shield, Bell, Palette } from "@phosphor-icons/react";

export default function SettingsPage() {
  return (
    <div style={{ flex: 1, padding: "2rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
         <div>
           <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0, letterSpacing: "-0.04em" }}>Settings</h1>
           <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>Manage your account, API keys, and application preferences.</div>
         </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", maxWidth: "1000px" }}>
        
        {/* Sidebar Nav */}
        <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
           <button style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "var(--color-border)", border: "none", borderRadius: "8px", color: "var(--color-text-primary)", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              <User size={18} /> Profile
           </button>
           <button style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "transparent", border: "none", borderRadius: "8px", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              <Shield size={18} /> API Keys
           </button>
           <button style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "transparent", border: "none", borderRadius: "8px", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              <Bell size={18} /> Notifications
           </button>
           <button style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "transparent", border: "none", borderRadius: "8px", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              <Palette size={18} /> Appearance
           </button>
        </div>

        {/* Content Pane */}
        <div style={{ flex: 1, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "2rem" }}>
           <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", fontWeight: 600 }}>Profile Information</h2>
           
           <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>Full Name</label>
                <input type="text" defaultValue="Omar" style={{ width: "100%", padding: "0.75rem", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-text-primary)", fontSize: "0.875rem", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>Email Address</label>
                <input type="email" defaultValue="omar@example.com" style={{ width: "100%", padding: "0.75rem", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-text-primary)", fontSize: "0.875rem", outline: "none" }} />
              </div>
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", marginTop: "1rem" }}>
                 <button style={{ backgroundColor: "var(--color-text-primary)", color: "var(--color-bg)", padding: "0.75rem 1.5rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                    Save Changes
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
