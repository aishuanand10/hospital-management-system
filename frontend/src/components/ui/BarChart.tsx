export type BarDatum = {
  label: string;
  value: number;
  sublabel?: string;
};

export function BarChart({
  data,
  emptyMessage = "No data available.",
}: {
  data: BarDatum[];
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">{emptyMessage}</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={`${d.label}-${i}`}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium text-slate-700">{d.label}</span>
            <span className="ml-2 shrink-0 tabular-nums text-slate-500">
              {d.sublabel ?? d.value}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
              style={{ width: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
