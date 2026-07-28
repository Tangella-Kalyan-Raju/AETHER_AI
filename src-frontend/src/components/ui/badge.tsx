import React from "react";

export const Badge = ({ className, variant = "default", ...props }: any) => {
  const variants: any = {
    default:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    destructive:
      "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
    outline:
      "bg-transparent border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
  };

  const variantStyle = variants[variant] || variants.default;

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors ${variantStyle} ${className || ""}`}
      {...props}
    />
  );
};
