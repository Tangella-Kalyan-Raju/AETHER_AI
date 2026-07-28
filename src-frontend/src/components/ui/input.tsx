import React from "react";

export const Input = React.forwardRef(({ className, ...props }: any, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-10 w-full rounded-lg border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#161B22] px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-slate-50 transition-colors ${className || ""}`}
      {...props}
    />
  );
});
Input.displayName = "Input";
