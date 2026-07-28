import React from "react";

export const PageHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      {description && (
        <p className="text-base text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">{description}</p>
      )}
    </div>
  );
};
