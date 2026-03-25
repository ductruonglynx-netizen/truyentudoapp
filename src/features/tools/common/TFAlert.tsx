import React from "react";
import clsx from "clsx";

type Tone = "warn" | "success";

type Props = {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
};

export const TFAlert: React.FC<Props> = ({ tone = "warn", children, className }) => {
  const base = tone === "warn" ? "tf-alert-warn" : "tf-alert-success";
  return <div className={clsx(base, className)}>{children}</div>;
};
