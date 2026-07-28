import React, { useState } from "react";

export const Tabs = ({ children, defaultValue, className }: any) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab } as any);
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, className, activeTab, setActiveTab }: any) => {
  return (
    <div
      className={`flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-md ${className || ""}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab } as any);
        }
        return child;
      })}
    </div>
  );
};

export const TabsTrigger = ({ value, children, className, activeTab, setActiveTab }: any) => {
  const isActive = activeTab === value;
  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all flex-1 text-center ${
        isActive
          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
      } ${className || ""}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className, activeTab }: any) => {
  if (activeTab !== value) return null;
  return <div className={`mt-4 ${className || ""}`}>{children}</div>;
};
