import type { ReactNode } from 'react'
import type { Stage } from './growth.ts'

// Drawing of Klíček in its 9 phases, after the sketch in the design system.
// Colours come from CSS classes (`.k-*` in index.css), which take them from :root tokens.
// Coordinates share one frame: the drop sits at the bottom centre, x = 0 is the middle.

const LEAF_R = 'M0 0 C10 -12 26 -10 28 -6 C20 2 8 6 0 0Z'
const LEAF_L = 'M0 0 C-10 -12 -26 -10 -28 -6 C-20 2 -8 6 0 0Z'

const Leaf = ({ x, y, side, s = 1 }: { x: number; y: number; side: 'l' | 'r'; s?: number }) => (
  <path className="k-leaf" d={side === 'r' ? LEAF_R : LEAF_L} transform={`translate(${x} ${y}) scale(${s})`} />
)

const Dot = ({ x, y, r, c }: { x: number; y: number; r: number; c: string }) => (
  <circle className={c} cx={x} cy={y} r={r} />
)

const Stem = ({ d, w }: { d: string; w: number }) => <path className="k-stem" strokeWidth={w} d={d} />
const Branch = ({ d, w }: { d: string; w: number }) => <path className="k-branch" strokeWidth={w} d={d} />

/** The same face in every phase: big round eyes, cheeks, a small smile. */
function Face({ x = 0, y = 0, s = 1, lookUp = false }: { x?: number; y?: number; s?: number; lookUp?: boolean }) {
  const py = lookUp ? -2 : 1
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle className="k-eye" cx={-8} cy={0} r={6} />
      <circle className="k-eye" cx={8} cy={0} r={6} />
      <circle className="k-pupil" cx={-7} cy={py} r={3} />
      <circle className="k-pupil" cx={7} cy={py} r={3} />
      <ellipse className="k-cheek" cx={-14} cy={11} rx={3.5} ry={2} />
      <ellipse className="k-cheek" cx={14} cy={11} rx={3.5} ry={2} />
      <path className="k-pupil" d="M-5 10 Q0 17 5 10Z" />
    </g>
  )
}

/** The yellow drop with its face; `dy` sinks it into the soil. */
function Drop({ dy = 0, lookUp = false }: { dy?: number; lookUp?: boolean }) {
  return (
    <g transform={`translate(0 ${dy})`}>
      <path
        className="k-body"
        d="M0 194 C22 208 30 226 30 234 C30 248 16 256 0 256 C-16 256 -30 248 -30 234 C-30 226 -22 208 0 194Z"
      />
      <Face y={228} s={1.15} lookUp={lookUp} />
    </g>
  )
}

/** Golden roots — the melted drop, so the child sees Klíček is still there. */
const TreeRoots = ({ w = 7 }: { w?: number }) => (
  <g className="k-root" strokeWidth={w}>
    <path d="M-18 250 Q-32 254 -44 260" />
    <path d="M18 250 Q32 254 44 260" />
    <path d="M-8 252 Q-10 259 -17 265" />
    <path d="M8 252 Q10 259 17 265" />
  </g>
)

const Trunk = ({ top, bottom, topW }: { top: number; bottom: number; topW: number }) => (
  <path
    className="k-bark"
    d={`M${-bottom} 254 C${-bottom + 4} 225 ${-topW - 3} 190 ${-topW} ${top} L${topW} ${top} C${topW + 3} 190 ${bottom - 4} 225 ${bottom} 254Z`}
  />
)

interface PhaseArt {
  /** Drawn behind the extras. */
  back: ReactNode
  /** Small things that appear one by one as the phase goes on. */
  extras: ReactNode[]
  /** Drawn in front (the drop, the soil, the face in the trunk). */
  front: ReactNode
}

const phases: Record<Stage['phase'], PhaseArt> = {
  // 1 · Semínko: a stem tip peeks out of the drop's head
  1: {
    back: <Stem w={3.5} d="M0 196 C0 191 1 188 3 185" />,
    extras: [
      <Leaf key="a" x={3} y={186} side="r" s={0.35} />,
      <Leaf key="b" x={2} y={188} side="l" s={0.35} />,
      <Leaf key="c" x={1} y={191} side="r" s={0.3} />,
    ],
    front: <Drop />,
  },
  // 2 · Klíček: two leaves on a green stem
  2: {
    back: (
      <>
        <Stem w={3.5} d="M0 196 C0 186 2 180 5 175" />
        <Leaf x={4} y={180} side="r" />
        <Leaf x={2} y={184} side="l" />
      </>
    ),
    extras: [
      <Leaf key="a" x={5} y={176} side="r" s={0.5} />,
      <Leaf key="b" x={1} y={190} side="l" s={0.45} />,
      <Leaf key="c" x={1} y={191} side="r" s={0.45} />,
    ],
    front: <Drop />,
  },
  // 3 · Sazenička: taller stem, five leaves
  3: {
    back: (
      <>
        <Stem w={3.5} d="M0 196 C0 178 -2 160 1 140" />
        <Leaf x={0} y={184} side="r" />
        <Leaf x={0} y={176} side="l" />
        <Leaf x={-1} y={164} side="r" />
        <Leaf x={-1} y={156} side="l" />
        <Leaf x={1} y={142} side="r" s={0.8} />
      </>
    ),
    extras: [
      <Leaf key="a" x={1} y={143} side="l" s={0.8} />,
      <Leaf key="b" x={0} y={170} side="r" s={0.55} />,
      <Leaf key="c" x={0} y={189} side="l" s={0.55} />,
    ],
    front: <Drop />,
  },
  // 4 · Zakořeňuje: the drop sinks into the soil, golden rootlets at the sides
  4: {
    back: (
      <>
        <Stem w={4} d="M0 200 C0 176 -1 154 1 128" />
        <Leaf x={0} y={182} side="r" />
        <Leaf x={0} y={174} side="l" />
        <Leaf x={-1} y={162} side="r" />
        <Leaf x={-1} y={152} side="l" />
        <Leaf x={0} y={142} side="r" />
        <Leaf x={1} y={130} side="l" s={0.85} />
        <Leaf x={1} y={128} side="r" s={0.85} />
      </>
    ),
    extras: [
      <Leaf key="a" x={0} y={190} side="r" s={0.6} />,
      <Leaf key="b" x={0} y={168} side="l" s={0.6} />,
      <Leaf key="c" x={-1} y={147} side="r" s={0.6} />,
    ],
    front: (
      <>
        <Drop dy={4} />
        <path className="k-soil" d="M-56 270 C-46 258 -24 254 0 254 C24 254 46 258 56 270Z" />
        <g className="k-root" strokeWidth={6}>
          <path d="M-30 262 Q-42 263 -54 268" />
          <path d="M30 262 Q42 263 54 268" />
        </g>
      </>
    ),
  },
  // 5 · Proutek: only the eyes peek out of the soil, looking up; the stem turns woody
  5: {
    back: (
      <>
        <Branch w={6} d="M0 204 C0 180 -1 160 1 126" />
        <Branch w={3} d="M0 152 L-14 140 M0 144 L14 132" />
        <Leaf x={-14} y={140} side="l" />
        <Leaf x={14} y={132} side="r" />
        <Leaf x={1} y={170} side="r" />
        <Leaf x={0} y={182} side="l" />
        <Leaf x={1} y={128} side="l" s={0.8} />
        <Leaf x={1} y={126} side="r" s={0.8} />
      </>
    ),
    extras: [
      <Leaf key="a" x={0} y={160} side="l" s={0.65} />,
      <Leaf key="b" x={1} y={150} side="r" s={0.65} />,
      <Leaf key="c" x={0} y={192} side="r" s={0.6} />,
    ],
    front: (
      <>
        <Drop dy={8} lookUp />
        <path className="k-soil" d="M-52 264 C-42 246 -22 240 0 240 C22 240 42 246 52 264Z" />
        <g className="k-root" strokeWidth={6}>
          <path d="M-34 256 Q-44 258 -54 263" />
          <path d="M34 256 Q44 258 54 263" />
        </g>
      </>
    ),
  },
  // 6 · Mladý stromek: the face has moved into a thin trunk, golden roots
  6: {
    back: (
      <>
        <TreeRoots w={5} />
        <Trunk top={142} bottom={18} topW={6} />
        <Branch w={3} d="M-2 162 L-18 148 M2 156 L18 142" />
        <Dot c="k-leaf-deep" x={-16} y={132} r={14} />
        <Dot c="k-leaf-deep" x={16} y={128} r={14} />
        <Dot c="k-leaf" x={0} y={120} r={22} />
      </>
    ),
    extras: [
      <Dot key="a" c="k-leaf" x={-24} y={146} r={8} />,
      <Dot key="b" c="k-leaf" x={24} y={140} r={8} />,
      <Dot key="c" c="k-leaf" x={0} y={98} r={9} />,
    ],
    front: <Face y={200} s={0.75} />,
  },
  // 7 · Stromek: stronger trunk, round crown
  7: {
    back: (
      <>
        <TreeRoots />
        <Trunk top={110} bottom={24} topW={13} />
        <Dot c="k-leaf-deep" x={-22} y={132} r={20} />
        <Dot c="k-leaf-deep" x={22} y={132} r={20} />
        <Dot c="k-leaf" x={0} y={116} r={30} />
      </>
    ),
    extras: [
      <Dot key="a" c="k-leaf-deep" x={-40} y={118} r={10} />,
      <Dot key="b" c="k-leaf-deep" x={40} y={116} r={10} />,
      <Dot key="c" c="k-leaf" x={0} y={84} r={12} />,
    ],
    front: <Face y={196} />,
  },
  // 8 · Kvete: bigger crown with blossoms
  8: {
    back: (
      <>
        <TreeRoots />
        <Trunk top={110} bottom={24} topW={13} />
        <Branch w={5} d="M-6 150 L-22 126 M6 142 L22 120" />
        <Dot c="k-leaf-deep" x={-26} y={106} r={22} />
        <Dot c="k-leaf-deep" x={26} y={106} r={22} />
        <Dot c="k-leaf" x={-14} y={76} r={22} />
        <Dot c="k-leaf" x={14} y={76} r={22} />
        <Dot c="k-leaf" x={0} y={96} r={32} />
        <g className="k-blossom">
          <circle cx={-22} cy={96} r={4.5} />
          <circle cx={14} cy={78} r={4.5} />
          <circle cx={26} cy={108} r={4.5} />
          <circle cx={-4} cy={114} r={4.5} />
          <circle cx={-34} cy={118} r={4.5} />
        </g>
      </>
    ),
    extras: [
      <Dot key="a" c="k-blossom" x={2} y={90} r={4.5} />,
      <Dot key="b" c="k-blossom" x={-14} y={70} r={4.5} />,
      <Dot key="c" c="k-blossom" x={34} y={92} r={4.5} />,
    ],
    front: <Face y={196} />,
  },
  // 9 · Jabloň: apples and a shaded lower crown
  9: {
    back: (
      <>
        <TreeRoots />
        <Trunk top={110} bottom={24} topW={13} />
        <Branch w={5} d="M-6 150 L-22 126 M6 142 L22 120" />
        <Dot c="k-leaf-shade" x={-26} y={106} r={22} />
        <Dot c="k-leaf-shade" x={26} y={106} r={22} />
        <Dot c="k-leaf-deep" x={-14} y={76} r={22} />
        <Dot c="k-leaf-deep" x={14} y={76} r={22} />
        <Dot c="k-leaf-deep" x={0} y={96} r={32} />
        <g className="k-apple">
          <circle cx={-22} cy={96} r={6} />
          <circle cx={14} cy={78} r={6} />
          <circle cx={26} cy={108} r={6} />
          <circle cx={-4} cy={114} r={6} />
          <circle cx={-34} cy={118} r={6} />
          <circle cx={2} cy={92} r={6} />
          <circle cx={-14} cy={70} r={6} />
        </g>
      </>
    ),
    extras: [],
    front: <Face y={196} />,
  },
}

/** Klíček at one stage. Decorative: the caller gives the accessible name. */
export function KlicekArt({ stage, className }: { stage: Stage; className?: string }) {
  const art = phases[stage.phase]
  return (
    <svg
      className={className}
      viewBox="-65 30 130 240"
      aria-hidden="true"
      focusable="false"
      data-phase={stage.phase}
      data-extras={stage.extras}
    >
      {art.back}
      {art.extras.slice(0, stage.extras)}
      {art.front}
    </svg>
  )
}
