import { cn } from "@/lib/utils";

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

// Une rangée de pastilles dont une seule est choisie (rayon, façon d'acheter).
export function ChoiceChips<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-11 rounded-full border px-4 font-semibold transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
