import { Link } from "@tanstack/react-router";
import { BarChart3, House, Leaf } from "lucide-react";

const items = [
  { label: "Home", Icon: House, to: "/" as const },
  { label: "Practice", Icon: Leaf, to: "/practice" as const },
  { label: "Progress", Icon: BarChart3, to: "/progress" as const },
];

export function BottomNav({ discoveryStyle = false }: { discoveryStyle?: boolean }) {
  if (discoveryStyle) {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[573px] border-t border-border/45 bg-card/95 px-6 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl"
        aria-label="Primary navigation"
      >
        <div className="grid grid-cols-3">
          {items.map(({ label, Icon, to }) => {
            const displayLabel = label === "Practice" ? "Discover" : label;
            return (
              <Link
                key={label}
                to={to}
                activeOptions={{ exact: true }}
                className="group flex h-[62px] min-w-0 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors data-[status=active]:text-primary"
              >
                <span className="grid h-8 w-14 place-items-center rounded-xl transition-colors group-data-[status=active]:bg-primary-soft/70">
                  <Icon className="size-[21px] group-data-[status=active]:fill-primary group-data-[status=active]:text-primary" strokeWidth={1.8} />
                </span>
                <span className="font-sans text-[13px] font-medium leading-none">{displayLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/95 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-auto sm:mt-10 sm:max-w-md sm:rounded-full sm:border"
      aria-label="Primary navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map(({ label, Icon, to }) => (
          <Link
            key={label}
            to={to}
            activeOptions={{ exact: true }}
            className="flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-muted-foreground transition-colors data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
