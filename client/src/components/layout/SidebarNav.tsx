import { cn } from "@/lib/utils";
import { CollapsibleNavItem } from "./CollapsibleNavItem";
import { getNavStructure } from "./navConfig";

interface SidebarNavProps {
  isCollapsed: boolean;
  location: string;
  setLocation: (path: string) => void;
  onNavigate?: (path: string) => void;
}

export function SidebarNav({ isCollapsed, location, setLocation, onNavigate }: SidebarNavProps) {
  const navStructure = getNavStructure(location);

  return (
    <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {navStructure.map((item, idx) => {
        if ("heading" in item) {
          return (
            <div key={item.heading} className={cn(idx > 0 && "mt-4")}>
              {!isCollapsed && (
                <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA] select-none">
                  {item.heading}
                </p>
              )}
              {isCollapsed && idx > 0 && (
                <div className="mx-2 my-2 h-px bg-[#E0E0E0]" />
              )}
              <div className="space-y-0.5">
                {item.items.map((subItem) => (
                  <CollapsibleNavItem
                    key={subItem.path}
                    item={subItem}
                    location={location}
                    setLocation={(p) => {
                      setLocation(p);
                      onNavigate?.(p);
                    }}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          );
        }
        return (
          <CollapsibleNavItem
            key={item.path}
            item={item}
            location={location}
            setLocation={(p) => {
              setLocation(p);
              onNavigate?.(p);
            }}
            isCollapsed={isCollapsed}
          />
        );
      })}
    </div>
  );
}
