import { cn } from "@/lib/cn";
import "./footer.scss";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <div className={cn("footer", className)}>
      <span className="footer__brand">Optivo</span>
      <span className="footer__copy">&copy; {new Date().getFullYear()}</span>
    </div>
  );
}
