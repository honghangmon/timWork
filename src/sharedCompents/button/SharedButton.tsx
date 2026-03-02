import type { ButtonHTMLAttributes } from "react";
import "./SharedButton.css";

type SharedButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SharedButton({ className, type = "button", ...rest }: SharedButtonProps) {
  const classes = ["shared-button", className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...rest} />;
}
