import { ArrowUpRight } from "lucide-react";

export default function Button({
    children,
    onClick,
    variant = "dark",
}) {
    return (
        <button
            className={`nx-button nx-button-${variant}`}
            onClick={onClick}
        >
            <span>{children}</span>
            <ArrowUpRight size={17} />
        </button>
    );
}