import { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
}

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: SectionHeaderProps) => {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
      <div className={`max-w-2xl ${alignClass}`}>
        {eyebrow && (
          <div
            className={`inline-flex items-center gap-2 mb-3 ${align === "center" ? "justify-center" : ""}`}
          >
            <span className="h-0.5 w-8 bg-accent" />
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              {eyebrow}
            </span>
            <span className="h-0.5 w-8 bg-accent" />
          </div>
        )}
        <h2 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl text-foreground mb-2 text-balance">
          {title}
        </h2>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
