import Image from "next/image";
import type { ReactNode } from "react";

import logo2 from "@/assets/logo2-cut.png";
import rocchiaLogo from "@/assets/rocchia-logo-cut.png";

const FRONT_SKYLINE =
  "M0 320 V250 H60 V210 H110 V250 H150 V170 H175 V150 H200 V170 H225 V250 H270 V200 H330 V250 " +
  "H360 V120 H380 V100 H400 V120 H420 V250 H470 V190 H540 V250 H580 V150 H640 V250 H680 V220 " +
  "H720 V180 H735 V140 H750 V180 H765 V250 H820 V160 H880 V250 H910 V210 H960 V250 H1000 V110 " +
  "H1020 V80 H1040 V110 H1060 V250 H1100 V190 H1160 V250 H1200 V160 H1240 V250 H1280 V210 " +
  "H1330 V250 H1370 V180 H1440 V320";

const BACK_SKYLINE =
  "M0 320 V230 H90 V180 H140 V230 H200 V140 H260 V230 H310 V190 H390 V230 H440 V130 H500 V230 " +
  "H560 V170 H620 V230 H700 V150 H760 V230 H840 V120 H900 V230 H960 V170 H1040 V230 H1090 V140 " +
  "H1150 V230 H1220 V180 H1290 V230 H1340 V150 H1400 V230 H1440 V320";

const WINDOWS: ReadonlyArray<readonly [x: number, y: number]> = [
  [1012, 150],
  [395, 160],
  [160, 205],
  [618, 190],
  [860, 175],
  [1385, 195],
  [370, 210],
  [1040, 200],
  [485, 205],
  [205, 185],
  [835, 225],
  [592, 165],
  [1212, 175],
  [1410, 220],
  [1012, 225],
  [395, 135],
  [515, 225],
  [1040, 125],
];

const WINDOW_DURATIONS = [2.6, 3.4, 4.1, 3.1, 4.8];

export function LoginScene({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none overflow-hidden bg-primary ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.09),transparent_60%)]" />
      <LoginSky />
      <LoginDrift />
      <LoginSkyline />
    </div>
  );
}

export function LoginSky() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[68%] overflow-hidden"
    >
      <div className="login-sky-haze login-sky-haze--near" />
      <div className="login-sky-haze login-sky-haze--far" />
    </div>
  );
}

function DriftMark({ children, className }: { children: ReactNode; className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function LoginDrift() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 text-login-accent">
      <div className="login-drift-lane login-drift-lane--left">
        <div className="login-drift-slot">
          <DriftMark className="login-drift-piece login-drift-piece--key">
            <circle cx="22" cy="22" r="8" />
            <path d="M28 28 50 50" />
            <path d="M42 42v8" />
            <path d="M48 48v6" />
          </DriftMark>
        </div>
        <div className="login-drift-slot">
          <Image
            src={rocchiaLogo}
            alt=""
            width={56}
            height={56}
            className="login-drift-piece login-drift-piece--logo"
          />
        </div>
        <div className="login-drift-slot">
          <DriftMark className="login-drift-piece login-drift-piece--scales">
            <path d="M32 10v8" />
            <path d="M14 20h36" />
            <path d="M18 20c0 8 4 12 8 12s8-4 8-12" />
            <path d="M30 20c0 8 4 12 8 12s8-4 8-12" />
            <path d="M32 18v30" />
            <path d="M22 52h20" />
          </DriftMark>
        </div>
      </div>
      <div className="login-drift-lane login-drift-lane--right">
        <div className="login-drift-slot">
          <DriftMark className="login-drift-piece login-drift-piece--house">
            <path d="M10 30 32 12l22 18" />
            <path d="M16 28v22h32V28" />
            <path d="M28 50V36h8v14" />
          </DriftMark>
        </div>
        <div className="login-drift-slot">
          <DriftMark className="login-drift-piece login-drift-piece--deed">
            <path d="M16 12h24l10 10v30H16V12z" />
            <path d="M40 12v10h10" />
            <path d="M24 30h16" />
            <path d="M24 38h12" />
          </DriftMark>
        </div>
        <div className="login-drift-slot">
          <Image
            src={logo2}
            alt=""
            width={128}
            height={128}
            className="login-drift-piece login-drift-piece--logo2"
          />
        </div>
      </div>
    </div>
  );
}

export function LoginSkyline() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] max-h-[340px] min-h-[160px]"
    >
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
        fill="none"
      >
        <path
          d={BACK_SKYLINE}
          pathLength={1}
          className="login-skyline-path login-skyline-path--back"
          stroke="var(--login-accent)"
          strokeOpacity={0.22}
          strokeWidth={1.25}
          strokeLinejoin="round"
        />
        <path
          d={FRONT_SKYLINE}
          pathLength={1}
          className="login-skyline-path"
          stroke="var(--login-accent)"
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {WINDOWS.map(([x, y], index) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={7}
            height={9}
            rx={1}
            fill="var(--login-accent)"
            className="login-window"
            style={{
              animationDuration: `${WINDOW_DURATIONS[index % WINDOW_DURATIONS.length]}s`,
              animationDelay: `${1.7 + ((index * 0.47) % 3.2)}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
