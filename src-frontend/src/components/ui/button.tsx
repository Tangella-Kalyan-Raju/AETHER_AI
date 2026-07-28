import React from "react";

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }: any, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
    const variants: any = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow",
      outline:
        "border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
      ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
      destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow",
    };
    const sizes: any = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-lg px-8 text-base",
      icon: "h-10 w-10",
    };

    const variantStyle = variants[variant] || variants.default;
    const sizeStyle = sizes[size] || sizes.default;

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className || ""}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
