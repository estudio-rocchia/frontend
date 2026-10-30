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

const WINDOWS_START_S = 1.3;
const WINDOWS_STEP_S = 0.09;

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
            style={{ animationDelay: `${WINDOWS_START_S + index * WINDOWS_STEP_S}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
