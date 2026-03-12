import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavCollapsible } from "./navConfig";

interface CollapsibleNavItemProps {
  item: NavCollapsible;
  location: string;
  setLocation: (path: string) => void;
  isCollapsed: boolean;
}

export function CollapsibleNavItem({
  item,
  location,
  setLocation,
  isCollapsed,
}: CollapsibleNavItemProps) {
  const hasChildren = !!item.children?.length;
  const matchesPath = (candidate: string) =>
    location === candidate || (candidate !== "/" && location.startsWith(candidate + "/"));

  const isSelfActive =
    matchesPath(item.path) ||
    item.matchPaths?.some((path) => matchesPath(path)) ||
    false;
  const isChildActive = hasChildren
    ? item.children!.some((c) => matchesPath(c.path) || c.matchPaths?.some((path) => matchesPath(path)))
    : false;
  const isActive = isSelfActive || isChildActive;
  const [open, setOpen] = useState(isActive || isChildActive);

  useEffect(() => {
    if (isChildActive || isSelfActive) setOpen(true);
  }, [location, isChildActive, isSelfActive]);

  if (!hasChildren) {
    return (
      <button
        onClick={() => setLocation(item.path)}
        className={cn(
          "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 text-left group border-l-[3px]",
          isActive
            ? "border-l-[#F2DD48] bg-[#F1F1EF] text-[#222222] font-semibold"
            : "border-l-transparent text-[#6F6F6B] hover:bg-[#F1F1EF] hover:text-[#222222]"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-[#222222]" : "text-[#A8A8A3] group-hover:text-[#6F6F6B]"
          )}
        />
        {!isCollapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          if (isCollapsed) setLocation(item.children![0].path);
          else setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 text-left group border-l-[3px]",
          isActive || isChildActive
            ? "border-l-[#F2DD48] bg-[#F1F1EF] text-[#222222] font-semibold"
            : "border-l-transparent text-[#6F6F6B] hover:bg-[#F1F1EF] hover:text-[#222222]"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive || isChildActive
              ? "text-[#222222]"
              : "text-[#A8A8A3] group-hover:text-[#6F6F6B]"
          )}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#A8A8A3] shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#A8A8A3] shrink-0" />
            )}
          </>
        )}
      </button>
      {!isCollapsed && open && (
        <div className="ml-5 mt-0.5 border-l border-[#E9E9E6] pl-3 space-y-0.5">
          {item.children!.map((child) => {
            const childActive = matchesPath(child.path) || child.matchPaths?.some((path) => matchesPath(path));
            return (
              <button
                key={child.path}
                onClick={() => setLocation(child.path)}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors duration-150 text-left",
                  childActive
                    ? "text-[#222222] font-semibold bg-[#F1F1EF]"
                    : "text-[#6F6F6B] hover:text-[#222222] hover:bg-[#F1F1EF]"
                )}
              >
                <child.icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    childActive ? "text-[#F2DD48]" : "text-[#A8A8A3]"
                  )}
                />
                <span className="truncate">{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
