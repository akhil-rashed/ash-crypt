import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Asterisk,
  Binary,
  Braces,
  Check,
  ChevronDown,
  Code2,
  Fingerprint,
  Globe2,
  Search,
  Star,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { categories, tools } from "../lib/conversions";
import type { Tool } from "../lib/conversions";

export const categoryIcons = {
  encodings: ArrowLeftRight,
  hashes: Fingerprint,
  formatters: Braces,
  network: Globe2,
};

export function ToolIcon({ tool, size = 19 }: { tool: Tool; size?: number }) {
  const Icon =
    tool.id === "binary"
      ? Binary
      : tool.id === "base64" || tool.id === "base64url"
        ? Code2
        : categoryIcons[tool.category];
  return <Icon size={size} strokeWidth={1.7} />;
}

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <div className="brand-symbol">
        <Asterisk size={30} strokeWidth={2.2} />
      </div>
      <span>
        AshCrypt<span className="brand-period">.</span>
      </span>
      {!small && <span className="version">2.0</span>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "is-on" : ""}`}
      onClick={onChange}
      disabled={disabled}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 550, damping: 32 }}
      />
    </button>
  );
}

export function Modal({
  children,
  title,
  onClose,
  className = "",
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first =
      ref.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      ref.current?.querySelector<HTMLElement>("input, textarea") ??
      ref.current?.querySelector<HTMLElement>("button");
    (first || ref.current)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !ref.current) return;
      const focusable = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea, select, a[href], [tabindex="0"]',
        ),
      ).filter((element) => element.offsetParent !== null);
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <motion.div
      className={`modal-backdrop ${className === "history-modal" ? "drawer-backdrop" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={`modal glass ${className}`}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <div className="modal-title">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="icon-button close-modal"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ToolPicker({
  selected,
  favorites,
  onSelect,
  onFavorite,
}: {
  selected: Tool;
  favorites: string[];
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const outside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
      if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
      const options = Array.from(
        ref.current?.querySelectorAll<HTMLButtonElement>("[data-option]") || [],
      );
      const current = options.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      event.preventDefault();
      options[
        (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
          options.length
      ]?.focus();
    };
    document.addEventListener("mousedown", outside);
    const element = ref.current;
    element?.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", outside);
      element?.removeEventListener("keydown", key);
    };
  }, [open]);
  const results = tools.filter((tool) =>
    query
      ? `${tool.name} ${tool.description}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : tool.category === selected.category,
  );
  return (
    <div className="tool-picker" ref={ref}>
      <button
        className={`tool-picker-trigger ${open ? "open" : ""}`}
        type="button"
        title={selected.description}
        aria-label={`Select format: ${selected.name}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setQuery("");
          setOpen(!open);
        }}
      >
        <span className="picker-icon">
          <ToolIcon tool={selected} size={18} />
        </span>
        <span className="selected-tool-name">{selected.name}</span>
        <ChevronDown size={15} className={open ? "rotated" : ""} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="tool-popover glass"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className="popover-search">
              <Search size={16} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a format..."
                aria-label="Search formats"
              />
            </div>
            <div
              id={listId}
              role="listbox"
              aria-label="Available formats"
              className="tool-options"
            >
              {results.length ? (
                results.map((tool) => (
                  <div
                    key={tool.id}
                    className={`tool-option-row ${tool.id === selected.id ? "selected" : ""}`}
                  >
                    <button
                      data-option
                      role="option"
                      aria-selected={tool.id === selected.id}
                      className="tool-option"
                      type="button"
                      onClick={() => {
                        onSelect(tool.id);
                        setOpen(false);
                      }}
                    >
                      <ToolIcon tool={tool} size={17} />
                      <span>{tool.name}</span>
                      {tool.id === selected.id && <Check size={15} />}
                    </button>
                    <button
                      type="button"
                      className={`option-favorite icon-button ${favorites.includes(tool.id) ? "favorited" : ""}`}
                      aria-label={`${favorites.includes(tool.id) ? "Unpin" : "Pin"} ${tool.name}`}
                      onClick={() => onFavorite(tool.id)}
                    >
                      <Star
                        size={14}
                        fill={
                          favorites.includes(tool.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-tools">
                  No matches. Try another little idea.
                </div>
              )}
            </div>
            <div className="popover-note">
              {query
                ? "All tools"
                : categories.find(
                    (category) => category.id === selected.category,
                  )?.short}{" "}
              &middot; {results.length} available
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
