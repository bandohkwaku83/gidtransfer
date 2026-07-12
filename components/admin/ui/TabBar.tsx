export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { label: string; value: T }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-6 border-b border-slate-200/80">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            active === tab.value
              ? "text-primary"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.label}
          {active === tab.value && (
            <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
