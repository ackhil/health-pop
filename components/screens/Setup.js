"use client";
import React, { useState } from "react";
import { C, font, Face, Pill, Tile, FUTURE_CHIPS, inputStyle } from "../design";

export default function Setup({ onDone }) {
  const [name, setName] = useState("");
  const [chips, setChips] = useState([]);

  const toggle = (chip) => setChips((c) => (c.includes(chip) ? c.filter((x) => x !== chip) : [...c, chip]));

  return (
    <div style={{ fontFamily: font, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Tile style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        <Face fill={C.purple} mood="happy" size={56} shape="blob" anim="pulse" />
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "10px 0 4px" }}>Meet Future You 💛</h1>
        <p style={{ color: C.sub, fontSize: 13.5, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
          One quick step — your avatar evolves toward this as your streaks grow.
        </p>

        <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="What should we call you?" value={name}
          onChange={(e) => setName(e.target.value)} />

        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, textAlign: "left" }}>Pick 1–2 that fit your goal</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
          {FUTURE_CHIPS.map((chip) => {
            const on = chips.includes(chip);
            return (
              <button key={chip} onClick={() => toggle(chip)} style={{
                background: on ? C.ink : "#fff", color: on ? "#fff" : C.ink, borderRadius: 999,
                padding: "9px 14px", fontSize: 13.5, fontWeight: 800, border: `2px solid ${on ? C.ink : C.line}`,
                fontFamily: "inherit", cursor: "pointer",
              }}>{chip}</button>
            );
          })}
        </div>

        <Pill style={{ width: "100%" }} onClick={() => onDone({ name: name.trim(), futureYou: chips })}>
          Continue →
        </Pill>
      </Tile>
    </div>
  );
}
