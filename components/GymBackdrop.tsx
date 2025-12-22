"use client";

import * as React from "react";

/**
 * GymBackdrop - cinematic full-screen cover (mobile first)
 * - Cover: nincs fekete sáv (de cropol)
 * - Megvilágított "spotlight" + finom rim light
 * - Olvashatóság: vignette + enyhe dim
 *
 * Elvárt fájl: /public/background.jpeg
 */
export function GymBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#07080b]">
      {/* --- PHOTO (cover) --- */}
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url(/background.jpeg)",
          backgroundSize: "cover",
          // állítsd bátran: 50% 10% / 50% 20% / 50% 35%
          backgroundPosition: "50% 18%",
          // világosabb + részletek vissza
          filter: "brightness(0.95) contrast(1.12) saturate(1.02)",
          transform: "scale(1.03)",
        }}
      />

      {/* --- SOFT LIGHT BEAMS (kicsit erősebb) --- */}
      <div className="absolute -inset-[40%] opacity-[0.26] blur-[1.5px]">
        <div className="beam beam-1" />
        <div className="beam beam-2" />
        <div className="beam beam-3" />
      </div>

      {/* --- SPOTLIGHT: "lámpa" középen felülről --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* top spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(700px_420px_at_50%_12%,rgba(255,255,255,0.30),transparent_65%)]" />
        {/* secondary side glow */}
        <div className="absolute inset-0 bg-[radial-gradient(520px_320px_at_22%_20%,rgba(255,255,255,0.10),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(520px_320px_at_78%_22%,rgba(255,255,255,0.08),transparent_70%)]" />
      </div>

      {/* --- RIM LIGHT (finom hideg fény a széleken) --- */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.35] mix-blend-screen">
        <div className="absolute inset-0 bg-[radial-gradient(900px_640px_at_0%_50%,rgba(99,102,241,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_640px_at_100%_50%,rgba(236,72,153,0.10),transparent_60%)]" />
      </div>

      {/* --- READABILITY LAYERS --- */}
      {/* Vignette: sötétít a széleken, a közepet nyitva hagyja */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_620px_at_50%_45%,rgba(0,0,0,0.06)_0%,transparent_35%,rgba(0,0,0,0.86)_84%)]" />
      {/* Global dim: csökkenti a "túl világos" részeket, de nem öli meg */}
      <div className="absolute inset-0 bg-black/25" />

      {/* --- GRAIN/NOISE (kissé kevesebb) --- */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay">
        <div className="noise" />
      </div>

      <style jsx>{`
        .beam {
          position: absolute;
          top: 0;
          left: 50%;
          width: 560px;
          height: 1500px;
          transform: translateX(-50%) rotate(18deg);
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.22),
            rgba(255, 255, 255, 0.06),
            rgba(255, 255, 255, 0)
          );
          mask-image: radial-gradient(closest-side, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
          border-radius: 999px;
          animation: drift 14s ease-in-out infinite;
        }

        .beam-1 {
          left: 40%;
          opacity: 0.55;
          filter: blur(1px);
          animation-duration: 15s;
        }

        .beam-2 {
          left: 55%;
          opacity: 0.45;
          animation-duration: 18s;
        }

        .beam-3 {
          left: 70%;
          opacity: 0.38;
          animation-duration: 20s;
        }

        .noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 240px 240px;
          animation: noise 3.2s steps(2) infinite;
        }

        @keyframes drift {
          0% {
            transform: translateX(-50%) rotate(18deg) translateY(0px);
          }
          50% {
            transform: translateX(-50%) rotate(18deg) translateY(18px);
          }
          100% {
            transform: translateX(-50%) rotate(18deg) translateY(0px);
          }
        }

        @keyframes noise {
          0% {
            transform: translate3d(0, 0, 0);
          }
          25% {
            transform: translate3d(-2%, 1%, 0);
          }
          50% {
            transform: translate3d(1%, -2%, 0);
          }
          75% {
            transform: translate3d(2%, 2%, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
