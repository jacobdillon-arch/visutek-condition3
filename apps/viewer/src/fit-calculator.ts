import type { SizeChart, SizeChartData, EaseData } from '@visutek/shared';

export type FitStatus = 'good' | 'warn' | 'bad' | 'roomy';

export interface FitResult {
  status: FitStatus;
  msg: string;
  delta: number;
}

export interface AnalysisResult {
  bestSize: string;
  waistFit: boolean;
  hipFit: boolean;
  inseam: number;
  verdictMsg: string;
  verdictColor: string;
  details: Array<{ label: string; yours: string; range: string; fit: boolean }>;
}

export function checkMeasurement(bodyVal: number, chartLo: number, chartHi: number, ease: number): FitResult {
  const gHi = chartHi + ease;
  const room = gHi - bodyVal;
  if (bodyVal < chartLo)      return { status: 'bad',   msg: 'Too tight — size up',  delta: chartLo - bodyVal };
  if (bodyVal > gHi)          return { status: 'bad',   msg: 'Too tight — size up',  delta: bodyVal - gHi };
  if (room > 3)               return { status: 'roomy', msg: 'Roomy — size down?',   delta: room };
  if (room >= 0 && room <= 1) return { status: 'warn',  msg: 'Snug fit',             delta: room };
  return                             { status: 'good',  msg: 'Good fit',             delta: room };
}

export function checkInseam(bodyInseam: number, chartInseam: number): FitResult {
  const diff = chartInseam - bodyInseam;
  if (diff < -1.5) return { status: 'bad',   msg: 'Too short',     delta: Math.abs(diff) };
  if (diff > 3)    return { status: 'roomy', msg: 'Very long',     delta: diff };
  if (diff > 1.5)  return { status: 'warn',  msg: 'Slightly long', delta: diff };
  return                  { status: 'good',  msg: 'Good length',   delta: diff };
}

export function runAnalysis(
  waistIn: number,
  hipIn: number,
  inseamLen: 'short' | 'reg' | 'tall',
  chartData: SizeChartData,
  ease: EaseData,
): AnalysisResult {
  const sizes = Object.keys(chartData);
  let bestSize = sizes[0];
  let bestScore = Infinity;

  const results: Record<string, { waistFit: boolean; hipFit: boolean; waistDist: number; hipDist: number; score: number }> = {};

  sizes.forEach(sz => {
    const c = chartData[sz];
    const waistFit = waistIn >= c.waist[0] && waistIn <= c.waist[1];
    const hipFit   = hipIn   >= c.hip[0]   && hipIn   <= c.hip[1];
    const waistDist = waistIn < c.waist[0] ? c.waist[0] - waistIn : waistIn > c.waist[1] ? waistIn - c.waist[1] : 0;
    const hipDist   = hipIn   < c.hip[0]   ? c.hip[0] - hipIn     : hipIn   > c.hip[1]   ? hipIn - c.hip[1]     : 0;
    const score = waistDist + hipDist;
    results[sz] = { waistFit, hipFit, waistDist, hipDist, score };
    if (score < bestScore || (score === bestScore && waistFit && !results[bestSize]?.waistFit)) {
      bestScore = score;
      bestSize = sz;
    }
  });

  const best = results[bestSize];
  const inseam = chartData[bestSize].inseam[inseamLen];
  const bothFit = best.waistFit && best.hipFit;
  const snug = !bothFit && (best.waistDist <= 1 || best.hipDist <= 1);

  const verdictColor = bothFit ? '#2d6a3f' : snug ? '#c8940a' : '#c0401a';
  const verdictMsg = bothFit
    ? `We recommend size <strong>${bestSize}</strong> — your measurements fit within this size's range.`
    : `We recommend size <strong>${bestSize}</strong> — closest to your measurements${snug ? ', may be slightly snug' : ''}.`;

  const c = chartData[bestSize];
  const details = [
    { label: 'Waist', yours: `${waistIn}"`, range: `${c.waist[0]}–${c.waist[1]}"`, fit: best.waistFit },
    { label: 'Hips',  yours: `${hipIn}"`,   range: `${c.hip[0]}–${c.hip[1]}"`,     fit: best.hipFit },
    { label: `Inseam (${inseamLen})`, yours: '—', range: `${inseam}"`, fit: true },
  ];

  return { bestSize, waistFit: best.waistFit, hipFit: best.hipFit, inseam, verdictMsg, verdictColor, details };
}

/** Convert cm to inches */
export function toIn(v: number, unit: 'in' | 'cm'): number {
  return unit === 'cm' ? v / 2.54 : v;
}

export function buildFitResultsHTML(result: AnalysisResult): string {
  const detailRows = result.details.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:0.5px solid rgba(0,0,0,0.08)">
      <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(0,0,0,0.45)">${r.label}</span>
      <span style="font-size:10px;color:rgba(0,0,0,0.55)">You: ${r.yours}</span>
      <span style="font-size:10px;color:${r.fit ? '#2d6a3f' : '#c8940a'}">${r.range}</span>
    </div>`).join('');

  return `
    <div style="background:${result.verdictColor}15;border:1px solid ${result.verdictColor}40;padding:12px 14px;margin-bottom:10px;font-size:12px;line-height:1.5">
      ${result.verdictMsg}
    </div>
    ${detailRows}`;
}
