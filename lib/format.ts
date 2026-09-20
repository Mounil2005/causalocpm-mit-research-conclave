export const fmtMoney = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`
    : n >= 1000
      ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: n >= 100000 ? 0 : 1 })}K`
      : `$${n}`;

export const fmtDays = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)} d`;

export const fmtInt = (n: number) => n.toLocaleString("en-US");

export const fmtPct = (n: number, d = 0) => `${n.toFixed(d)}%`;

export const fmtK = (n: number) =>
  n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`;
