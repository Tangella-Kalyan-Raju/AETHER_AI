import React from "react";

export const Card = ({ className, ...props }: any) => (
  <div
    className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E232B] text-slate-950 dark:text-slate-50 shadow-sm transition-all duration-200 hover:shadow-md ${className || ""}`}
    {...props}
  />
);
export const CardHeader = ({ className, ...props }: any) => (
  <div
    className={`flex flex-col space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800/50 ${className || ""}`}
    {...props}
  />
);
export const CardTitle = ({ className, ...props }: any) => (
  <h3
    className={`font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-white ${className || ""}`}
    {...props}
  />
);
export const CardDescription = ({ className, ...props }: any) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${className || ""}`} {...props} />
);
export const CardContent = ({ className, ...props }: any) => (
  <div className={`p-6 ${className || ""}`} {...props} />
);
