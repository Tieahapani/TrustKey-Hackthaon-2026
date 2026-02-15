interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function ScreeningBadge({ score, size = "md" }: Props) {
  const level = score >= 75 ? "green" : score >= 50 ? "yellow" : "red";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Fair" : "Weak";

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center rounded-full font-bold ${sizeClasses[size]} ${
          level === "green"
            ? "bg-screening-green-bg text-screening-green"
            : level === "yellow"
            ? "bg-screening-yellow-bg text-screening-yellow"
            : "bg-screening-red-bg text-screening-red"
        }`}
      >
        {score}
      </div>
      {size !== "sm" && (
        <span
          className={`text-xs font-medium ${
            level === "green"
              ? "text-screening-green"
              : level === "yellow"
              ? "text-screening-yellow"
              : "text-screening-red"
          }`}
        >
          {label} Match
        </span>
      )}
    </div>
  );
}
