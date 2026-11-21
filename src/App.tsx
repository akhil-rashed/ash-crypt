import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clipboard,
  Clock3,
  Code2,
  Command,
  Copy,
  CornerDownLeft,
  Expand,
  Fingerprint,
  Heart,
  History,
  Keyboard,
  Laptop,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Type,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Brand,
  Modal,
  Toggle,
  ToolIcon,
  ToolPicker,
  categoryIcons,
} from "./components/WorkspaceUI";
import {
  byteCount,
  categories,
  characterCount,
  convert,
  detectInput,
  exampleFor,
  getTool,
  tools,
} from "./lib/conversions";
import type { Action, Category } from "./lib/conversions";

type Theme = "light" | "dark" | "system";
type Overlay =
  | "search"
  | "favorites"
  | "history"
  | "guide"
  | "settings"
  | "input"
  | "output"
  | null;
type Toast = { id: number; text: string; type: "success" | "error" | "info" };
type HistoryEntry = {
  id: string;
  toolId: string;
  action: Action;
  input: string;
  output: string;
  time: number;
};

function readPreference<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`ashcrypt-${key}`);
    if (value === null) return fallback;
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(fallback))
      return Array.isArray(parsed) ? (parsed as T) : fallback;
    if (typeof parsed !== typeof fallback) return fallback;
    if (
      key === "theme" &&
      !["light", "dark", "system"].includes(String(parsed))
    )
      return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function readHistory(): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem("ashcrypt-history") || "[]",
    );
    return Array.isArray(value)
      ? value
          .filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              tools.some((tool) => tool.id === item.toolId) &&
              typeof item.input === "string" &&
              typeof item.output === "string" &&
              item.input.length + item.output.length <= 100_000 &&
              ["encode", "decode"].includes(item.action) &&
              Number.isFinite(item.time) &&
              Math.abs(item.time) <= 8.64e15,
          )
          .slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

function usePreference<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readPreference(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(`ashcrypt-${key}`, JSON.stringify(value));
    } catch {
      /* The workspace also works with storage disabled. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export default function App() {
  const [toolId, setToolId] = useState("base64");
  const [action, setAction] = useState<Action>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [guideTab, setGuideTab] = useState("start");
  const [toast, setToast] = useState<Toast | null>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = usePreference<Theme>("theme", "light");
  const [autoDetect, setAutoDetect] = usePreference("auto-detect", true);
  const [live, setLive] = usePreference("live", false);
  const [saveHistory, setSaveHistory] = usePreference("session-history", true);
  const [rawFavorites, setFavorites] = usePreference<string[]>("favorites", [
    "base64",
    "url",
    "sha256",
  ]);
  const favorites = useMemo(
    () =>
      Array.isArray(rawFavorites)
        ? [
            ...new Set(
              rawFavorites.filter((id) => tools.some((tool) => tool.id === id)),
            ),
          ]
        : ["base64", "url", "sha256"],
    [rawFavorites],
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    readPreference("session-history", true) ? readHistory() : [],
  );
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const runId = useRef(0);
  const skipDetection = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();
  const tool = getTool(toolId);
  const category = tool.category;
  const detection = useMemo(() => detectInput(input), [input]);
  const inputMetrics = useMemo(
    () => ({ characters: characterCount(input), bytes: byteCount(input) }),
    [input],
  );
  const outputMetrics = useMemo(
    () => ({ characters: characterCount(output), bytes: byteCount(output) }),
    [output],
  );
  const isDark = theme === "dark" || (theme === "system" && systemDark);
  const isFormatter = category === "formatters";
  const formatterMode = toolId.endsWith("Minify")
    ? "Minify"
    : toolId.endsWith("Validate")
      ? "Validate"
      : "Pretty";
  const isReversible =
    !isFormatter && category !== "hashes" && toolId !== "urlDecodeAll";
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const primaryLabel =
    category === "hashes"
      ? "Generate hash"
      : isFormatter
        ? formatterMode === "Validate"
          ? "Validate text"
          : formatterMode === "Minify"
            ? "Minify text"
            : "Format text"
        : action === "encode"
          ? "Encode text"
          : "Decode text";
  const activeCategory = categories.find((item) => item.id === category)!;

  const notify = useCallback(
    (text: string, type: Toast["type"] = "success") =>
      setToast({ id: Date.now(), text, type }),
    [],
  );
  const closeOverlay = useCallback(() => {
    setOverlay(null);
  }, []);
  const openOverlay = useCallback((value: Overlay) => {
    setQuery("");
    setMobileMenu(false);
    setOverlay(value);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", isDark ? "#191824" : "#f7f7fb");
  }, [isDark]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const change = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timeout);
  }, [copied]);
  useEffect(() => {
    try {
      if (saveHistory)
        sessionStorage.setItem("ashcrypt-history", JSON.stringify(history));
      else sessionStorage.removeItem("ashcrypt-history");
    } catch {
      /* Large histories may exceed private-browsing quotas. */
    }
  }, [history, saveHistory]);
  useEffect(() => {
    if (!mobileMenu) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenu]);

  // Android hardware/gesture Back closes the open dialog first, then the
  // navigation drawer, and only then leaves the app.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => Promise<void> } | undefined;
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (overlay) setOverlay(null);
      else if (mobileMenu) setMobileMenu(false);
      else if (canGoBack) window.history.back();
      else void CapacitorApp.exitApp();
    })
      .then((registered) => {
        handle = registered;
      })
      .catch(() => undefined);
    return () => {
      void handle?.remove();
    };
  }, [overlay, mobileMenu]);

  const updateInput = useCallback((value: string) => {
    runId.current += 1;
    setInput(value);
    setOutput("");
    setError(null);
    setDuration(null);
    setBusy(false);
    setCopied(false);
  }, []);

  const selectTool = useCallback(
    (id: string, manual = true) => {
      const next = getTool(id);
      runId.current += 1;
      setToolId(next.id);
      setOutput("");
      setError(null);
      setDuration(null);
      setBusy(false);
      setMobileMenu(false);
      setCopied(false);
      if (manual) skipDetection.current = input;
      if (next.category === "hashes" || next.category === "formatters")
        setAction("encode");
      else if (id === "urlDecodeAll") setAction("decode");
    },
    [input],
  );

  const selectCategory = (nextCategory: Category) => {
    const defaultIds: Record<Category, string> = {
      encodings: "base64",
      hashes: "sha256",
      formatters: "jsonPretty",
      network: "urlDecodeAll",
    };
    selectTool(defaultIds[nextCategory]);
  };

  useEffect(() => {
    if (
      !autoDetect ||
      !input ||
      skipDetection.current === input ||
      !detection.toolId
    )
      return;
    const detected = getTool(detection.toolId);
    if (isFormatter && detected.category === "formatters") {
      const prefix = detection.toolId.startsWith("xml") ? "xml" : "json";
      const id = prefix + formatterMode;
      if (id !== toolId) selectTool(id, false);
    } else if (
      action === "decode" &&
      !isFormatter &&
      category !== "hashes" &&
      ["encodings", "network"].includes(detected.category) &&
      detection.toolId !== toolId
    ) {
      selectTool(detection.toolId, false);
    }
  }, [
    autoDetect,
    input,
    detection,
    action,
    category,
    isFormatter,
    formatterMode,
    toolId,
    selectTool,
  ]);

  const toggleFavorite = (id: string) => {
    const exists = favorites.includes(id);
    setFavorites(
      exists ? favorites.filter((item) => item !== id) : [...favorites, id],
    );
    notify(
      exists
        ? `${getTool(id).name} unpinned.`
        : `${getTool(id).name} pinned. A little closer next time.`,
      "info",
    );
  };

  const runConversion = useCallback(
    async (record = true) => {
      const id = ++runId.current;
      setBusy(true);
      setError(null);
      setCopied(false);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (id !== runId.current) return;
      const started = performance.now();
      try {
        const result = convert(input, toolId, action);
        if (id !== runId.current) return;
        setOutput(result);
        setDuration(Math.max(1, Math.round(performance.now() - started)));
        if (record && saveHistory) {
          const entry: HistoryEntry = {
            id: crypto.randomUUID?.() || String(Date.now()),
            toolId,
            action,
            input,
            output: result,
            time: Date.now(),
          };
          if (input.length + result.length <= 100_000)
            setHistory((previous) =>
              [
                entry,
                ...previous.filter(
                  (item) =>
                    !(
                      item.input === input &&
                      item.toolId === toolId &&
                      item.action === action
                    ),
                ),
              ].slice(0, 20),
            );
          else
            notify(
              "Converted. Large results are not saved to session history.",
              "info",
            );
        }
      } catch (caught) {
        setOutput("");
        setDuration(null);
        setError(
          caught instanceof Error
            ? caught.message
            : "Something did not look right. Please check your input.",
        );
        if (record) notify("A small hiccup. Check the input below.", "error");
      } finally {
        if (id === runId.current) setBusy(false);
      }
    },
    [input, toolId, action, saveHistory, notify],
  );

  useEffect(() => {
    if (!live || !input) return;
    const timeout = setTimeout(() => {
      void runConversion(false);
    }, 380);
    return () => clearTimeout(timeout);
  }, [live, input, runConversion]);

  const clearAll = useCallback(() => {
    updateInput("");
    if (uploadRef.current) uploadRef.current.value = "";
    inputRef.current?.focus();
    notify("A clean slate. Make something new.", "info");
  }, [notify, updateInput]);
  const copyOutput = useCallback(async () => {
    if (!output) return;
    try {
      if (navigator.clipboard?.writeText)
        await navigator.clipboard.writeText(output);
      else {
        const element = document.createElement("textarea");
        element.value = output;
        element.style.position = "fixed";
        element.style.opacity = "0";
        document.body.appendChild(element);
        element.select();
        const success = document.execCommand("copy");
        element.remove();
        if (!success) throw new Error("Clipboard unavailable");
      }
      setCopied(true);
      notify("Copied. On to your next good idea.");
    } catch {
      notify(
        "Clipboard access is blocked. Select the output and copy it manually.",
        "error",
      );
    }
  }, [output, notify]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        openOverlay("search");
      }
      if (
        event.key === "Enter" &&
        (!overlay || overlay === "input" || overlay === "output")
      ) {
        event.preventDefault();
        if (event.shiftKey) void copyOutput();
        else void runConversion();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyOutput, openOverlay, overlay, runConversion]);

  const changeAction = (next: Action) => {
    skipDetection.current = null;
    runId.current += 1;
    setAction(next);
    setOutput("");
    setError(null);
    setDuration(null);
    setBusy(false);
    setCopied(false);
  };
  const swap = () => {
    if (!output || !isReversible) return;
    skipDetection.current = output;
    runId.current += 1;
    setInput(output);
    setOutput(input);
    setAction(action === "encode" ? "decode" : "encode");
    setError(null);
    setDuration(null);
    setBusy(false);
    setCopied(false);
  };
  const paste = async () => {
    try {
      if (!navigator.clipboard?.readText) throw new Error("Unavailable");
      const text = await navigator.clipboard.readText();
      if (text.length > 1_000_000) throw new Error("too-large");
      updateInput(text);
      inputRef.current?.focus();
      if (!text) notify("Your clipboard is empty. A fresh start?", "info");
    } catch (caught) {
      notify(
        caught instanceof Error && caught.message === "too-large"
          ? "Please paste fewer than 1 million characters."
          : `Paste directly into the input with ${isMac ? "Cmd" : "Ctrl"}+V. Your browser is keeping the clipboard private.`,
        "info",
      );
      inputRef.current?.focus();
    }
  };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      notify(
        "A little smaller, please. Text files up to 1 MB are supported.",
        "error",
      );
      event.target.value = "";
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const encoding =
        bytes[0] === 0xff && bytes[1] === 0xfe
          ? "utf-16le"
          : bytes[0] === 0xfe && bytes[1] === 0xff
            ? "utf-16be"
            : "utf-8";
      updateInput(new TextDecoder(encoding, { fatal: true }).decode(bytes));
      notify(`${file.name} opened, right here on your device.`, "info");
    } catch {
      notify(
        "Please open a valid UTF-8 text file, or a UTF-16 file with a byte-order mark.",
        "error",
      );
    }
    if (uploadRef.current) uploadRef.current.value = "";
  };
  const download = () => {
    if (!output) return;
    const extension =
      toolId.startsWith("json") && !toolId.endsWith("Validate")
        ? "json"
        : toolId.startsWith("xml") && !toolId.endsWith("Validate")
          ? "xml"
          : "txt";
    const url = URL.createObjectURL(
      new Blob([output], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `ashcrypt-${toolId}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("A little file, ready for wherever you go.");
  };
  const loadExample = () => {
    skipDetection.current = null;
    updateInput(exampleFor(tool, action));
    inputRef.current?.focus();
  };
  const restoreEntry = (entry: HistoryEntry) => {
    runId.current += 1;
    skipDetection.current = entry.input;
    setToolId(entry.toolId);
    setAction(entry.action);
    setInput(entry.input);
    setOutput(entry.output);
    setError(null);
    setDuration(null);
    setBusy(false);
    setCopied(false);
    closeOverlay();
    notify("Right where you left off.", "info");
  };
  const searchResults = tools.filter(
    (item) =>
      (overlay !== "favorites" || favorites.includes(item.id)) &&
      `${item.name} ${item.description} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const textStats = (text: string) => {
    const metrics = text === input ? inputMetrics : outputMetrics;
    return (
      <>
        {metrics.characters.toLocaleString()} characters
        <span className="stat-dot">&middot;</span>
        {metrics.bytes.toLocaleString()} bytes
      </>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="page-grain" aria-hidden="true" />
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              className="mobile-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenu(false)}
            />
          )}
        </AnimatePresence>
        <aside
          className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}
          aria-label="Main navigation"
        >
          <div className="sidebar-brand">
            <Brand />
            <button
              type="button"
              className="icon-button mobile-close"
              aria-label="Close navigation"
              onClick={() => setMobileMenu(false)}
            >
              <X size={20} />
            </button>
          </div>
          <button
            className="sidebar-search"
            onClick={() => openOverlay("search")}
            type="button"
          >
            <Search size={16} />
            <span>Find a little tool...</span>
            <kbd>{isMac ? <Command size={10} /> : "Ctrl"} K</kbd>
          </button>
          <div className="nav-heading">
            YOUR TOOLKIT<span>{tools.length}</span>
          </div>
          <nav className="tool-nav">
            {categories.map((item) => {
              const Icon = categoryIcons[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${category === item.id ? "active" : ""}`}
                  onClick={() => selectCategory(item.id)}
                >
                  <Icon size={19} strokeWidth={1.65} />
                  <span>{item.name}</span>
                  {category === item.id && (
                    <motion.span
                      className="nav-active-dot"
                      layoutId="nav-dot"
                    />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-divider" />
          <div className="nav-heading">
            A LITTLE CLOSER
            <button
              className="icon-button tiny-button"
              aria-label="Manage pinned tools"
              type="button"
              onClick={() => openOverlay("favorites")}
            >
              <Star size={13} />
            </button>
          </div>
          <nav className="pinned-nav">
            {favorites.slice(0, 5).map((id) => (
              <button
                key={id}
                className={`pinned-item ${id === toolId ? "pinned-active" : ""}`}
                type="button"
                onClick={() => selectTool(id)}
              >
                <span className={`pin-dot pin-${getTool(id).category}`} />
                <span>{getTool(id).name}</span>
                <ArrowUpRight size={13} />
              </button>
            ))}
            {favorites.length === 0 && (
              <button
                className="add-favorites"
                onClick={() => openOverlay("search")}
                type="button"
              >
                Pin your favorite little tools <ArrowUpRight size={13} />
              </button>
            )}
          </nav>
          <button
            type="button"
            className="nav-item history-nav"
            onClick={() => openOverlay("history")}
          >
            <History size={18} strokeWidth={1.7} />
            <span>Recent activity</span>
            {history.length > 0 && (
              <span className="history-count">{history.length}</span>
            )}
          </button>
          <div className="sidebar-bottom">
            <div className="privacy-note">
              <div className="privacy-symbol">
                <ShieldCheck size={25} strokeWidth={1.45} />
              </div>
              <h3>Your words stay yours.</h3>
              <p>
                No servers. No prying eyes.
                <br />
                Just you and your browser.
              </p>
              <span className="private-label">
                <span />
                100% on-device
              </span>
            </div>
            <div className="sidebar-bottom-line" />
            <div className="sidebar-utilities">
              <button type="button" onClick={() => openOverlay("guide")}>
                <CircleHelp size={17} />A little help
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Workspace settings"
                onClick={() => openOverlay("settings")}
              >
                <Settings2 size={18} />
              </button>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="desktop-breadcrumb">
              <span className="workspace-mark">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span>Workspace</span>
              <ChevronRight size={13} />
              <span className="breadcrumb-current">{activeCategory.short}</span>
            </div>
            <div className="mobile-brand">
              <button
                type="button"
                className="icon-button"
                aria-label="Open navigation"
                onClick={() => setMobileMenu(true)}
              >
                <Menu size={21} />
              </button>
              <Brand small />
            </div>
            <div className="topbar-actions">
              <span className="local-status">
                <span />A private little workspace
              </span>
              <button
                type="button"
                className="icon-button keyboard-button"
                aria-label="Keyboard shortcuts"
                onClick={() => {
                  setGuideTab("shortcuts");
                  openOverlay("guide");
                }}
              >
                <Keyboard size={19} strokeWidth={1.6} />
              </button>
              <div className="theme-switch" aria-label="Appearance">
                <button
                  type="button"
                  className={!isDark ? "selected" : ""}
                  aria-label="Light appearance"
                  aria-pressed={!isDark}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={16} strokeWidth={1.7} />
                </button>
                <button
                  type="button"
                  className={isDark ? "selected" : ""}
                  aria-label="Dark appearance"
                  aria-pressed={isDark}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={15} strokeWidth={1.7} />
                </button>
              </div>
            </div>
          </header>
          <main className="workspace">
            <section className="workspace-intro">
              <motion.div
                className="intro-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <div className="intro-eyebrow">
                  <span className="little-spark">
                    <Asterisk size={14} strokeWidth={2.3} />
                  </span>{" "}
                  SMALL TOOLS. BEAUTIFUL POSSIBILITIES.
                </div>
                <h1>
                  A little text. A lot of <em>possibility.</em>
                </h1>
                <p>
                  Encode, decode, hash, and find a little clarity. All in your
                  own space.
                </p>
              </motion.div>
              <motion.div
                className="intro-art"
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.92 }}
                transition={{ duration: 1.1 }}
              >
                <img src="/images/liquid-glass.jpg" alt="" />
              </motion.div>
            </section>
            <motion.section
              className="transformer glass"
              aria-label="Text transformation workspace"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
            >
              <div className="transformer-toolbar">
                <div
                  className={`mode-control ${category === "hashes" ? "hash-mode-control" : ""}`}
                >
                  {category === "hashes" ? (
                    <div className="one-way-label">
                      <Fingerprint size={17} />
                      <span>One-way. One of a kind.</span>
                    </div>
                  ) : isFormatter ? (
                    ["Pretty", "Minify", "Validate"].map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        className={formatterMode === mode ? "selected" : ""}
                        onClick={() =>
                          selectTool(
                            (toolId.startsWith("xml") ? "xml" : "json") + mode,
                          )
                        }
                      >
                        {formatterMode === mode && (
                          <motion.span
                            className="mode-highlight"
                            layoutId="active-mode"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 33,
                            }}
                          />
                        )}
                        <span>{mode === "Pretty" ? "Format" : mode}</span>
                      </button>
                    ))
                  ) : (
                    (["encode", "decode"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        disabled={
                          toolId === "urlDecodeAll" && mode === "encode"
                        }
                        className={action === mode ? "selected" : ""}
                        onClick={() => changeAction(mode)}
                      >
                        {action === mode && (
                          <motion.span
                            className="mode-highlight"
                            layoutId="active-mode"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 33,
                            }}
                          />
                        )}
                        <span>
                          {mode === "encode" ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownToLine size={15} />
                          )}
                          {mode === "encode" ? "Encode" : "Decode"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <div className="format-selector">
                  <span className="format-caption">
                    {category === "hashes" ? "ALGORITHM" : "FORMAT"}
                  </span>
                  <ToolPicker
                    selected={tool}
                    favorites={favorites}
                    onSelect={selectTool}
                    onFavorite={toggleFavorite}
                  />
                </div>
                <div
                  className="autodetect"
                  title="Recognizes common input encodings in Decode mode, and JSON or XML in formatter mode. Ambiguous formats may need manual selection."
                >
                  <WandSparkles size={15} />
                  <span>Auto-detect</span>
                  <Toggle
                    label="Auto-detect input format"
                    checked={autoDetect}
                    onChange={() => {
                      skipDetection.current = null;
                      setAutoDetect(!autoDetect);
                    }}
                    disabled={category === "hashes"}
                  />
                </div>
              </div>
              {["md5", "sha1"].includes(toolId) && (
                <div className="legacy-advisory" role="note">
                  <CircleAlert size={13} />
                  A legacy fingerprint. Use for checksums, not passwords or new security systems.
                </div>
              )}
              <div className="editors">
                <div className="editor input-editor">
                  <div className="editor-header">
                    <label htmlFor="input-text">
                      <span className="editor-label-icon input-label-icon">
                        <Type size={14} />
                      </span>
                      Input
                    </label>
                    <div className="editor-header-actions">
                      <button
                        type="button"
                        className="text-icon-button paste-button"
                        onClick={() => void paste()}
                      >
                        <Clipboard size={14} />
                        <span>Paste</span>
                      </button>
                      <span className="toolbar-separator" />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Open a local text file"
                        title="Open a local text file"
                        onClick={() => uploadRef.current?.click()}
                      >
                        <Upload size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button expand-input"
                        aria-label="Expand input editor"
                        title="Expand input editor"
                        onClick={() => openOverlay("input")}
                      >
                        <Expand size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="editor-textarea-wrap">
                    <textarea
                      ref={inputRef}
                      id="input-text"
                      value={input}
                      onChange={(event) => updateInput(event.target.value)}
                      spellCheck={false}
                      maxLength={1_000_000}
                      placeholder={
                        "Every great idea starts with a little text.\nType or paste yours here..."
                      }
                      aria-label="Input text"
                      aria-describedby={error ? "conversion-error" : undefined}
                    />
                    <AnimatePresence>
                      {!input && (
                        <motion.button
                          className="try-example"
                          type="button"
                          onClick={loadExample}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Sparkles size={13} />
                          Or try a little example
                          <ArrowRight size={13} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="editor-stats">
                    <span>{textStats(input)}</span>
                    <span
                      className={`input-detection ${input && detection.toolId ? "detected" : ""}`}
                      title={
                        autoDetect
                          ? `${detection.label}${detection.confidence === "likely" ? " (likely). Format detection is a best-effort guess." : ""}`
                          : "Automatic format selection is off"
                      }
                    >
                      {autoDetect && input && <WandSparkles size={11} />}
                      {input ? detection.label : "UTF-8"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="swap-button"
                  disabled={!output || !isReversible}
                  aria-label="Swap input and output"
                  title={
                    isReversible
                      ? "Swap input and output"
                      : "This operation is not reversible"
                  }
                  onClick={swap}
                >
                  <ArrowLeftRight size={16} strokeWidth={1.7} />
                </button>
                <div
                  className={`editor output-editor ${error ? "editor-has-error" : ""}`}
                >
                  <div className="editor-header">
                    <label htmlFor="output-text">
                      <span className="editor-label-icon output-label-icon">
                        <Code2 size={14} />
                      </span>
                      Output
                    </label>
                    <div className="editor-header-actions">
                      <button
                        type="button"
                        className={`text-icon-button copy-button ${copied ? "copied" : ""}`}
                        disabled={!output}
                        onClick={() => void copyOutput()}
                      >
                        {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                      <span className="toolbar-separator" />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Download output"
                        title="Download output"
                        disabled={!output}
                        onClick={download}
                      >
                        <ArrowDownToLine size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Expand output editor"
                        title="Expand output editor"
                        onClick={() => openOverlay("output")}
                      >
                        <Expand size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="editor-textarea-wrap">
                    <textarea
                      id="output-text"
                      value={output}
                      readOnly
                      spellCheck={false}
                      aria-label="Output text"
                      className={output ? "has-output" : ""}
                    />
                    <AnimatePresence mode="wait">
                      {!output && !error && (
                        <motion.div
                          key="empty"
                          className="output-empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="empty-art">
                            <div className="empty-art-back" />
                            <div className="empty-art-front">
                              <Asterisk size={25} strokeWidth={1.2} />
                            </div>
                            <span className="empty-art-spark spark-one" />
                            <span className="empty-art-spark spark-two" />
                          </div>
                          <p>A little magic goes here.</p>
                          <span>Your transformed text will appear here.</span>
                        </motion.div>
                      )}
                      {error && (
                        <motion.div
                          key="error"
                          className="output-error"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <span className="error-symbol">
                            <CircleAlert size={22} strokeWidth={1.5} />
                          </span>
                          <h3>Almost. Let's try that again.</h3>
                          <p id="conversion-error" role="alert">
                            {error}
                          </p>
                          <button
                            type="button"
                            className="text-icon-button"
                            onClick={() => inputRef.current?.focus()}
                          >
                            Back to your text
                            <ArrowRight size={13} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="editor-stats">
                    <span>{textStats(output)}</span>
                    <span
                      className={`output-status ${output ? "success" : ""} ${error ? "error" : ""}`}
                    >
                      {output ? (
                        <Check size={12} />
                      ) : (
                        <span className="status-dot" />
                      )}
                      {duration !== null
                        ? `${duration} ms`
                        : error
                          ? "Check input"
                          : "Waiting for a little input"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="transformer-actions">
                <div className="secondary-actions">
                  <button
                    type="button"
                    className="clear-button text-icon-button"
                    disabled={!input && !output && !error}
                    onClick={clearAll}
                  >
                    <Trash2 size={14} />
                    <span>Clear all</span>
                  </button>
                  <span className="action-divider" />
                  <div
                    className="live-control"
                    title="Automatically transform your text after a short pause. Live results are not saved to history."
                  >
                    <Toggle
                      label="Live conversion"
                      checked={live}
                      onChange={() => setLive(!live)}
                    />
                    <span>Live mode</span>
                    {live && <span className="live-indicator" />}
                  </div>
                </div>
                <div className="primary-actions">
                  <span className="keyboard-hint">
                    {isMac ? <Command size={11} /> : <span>Ctrl</span>}
                    <CornerDownLeft size={12} />
                  </span>
                  <motion.button
                    type="button"
                    className="primary-button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.975 }}
                    disabled={busy}
                    onClick={() => void runConversion()}
                  >
                    <span>{busy ? "A little moment..." : primaryLabel}</span>
                    {busy ? (
                      <LoaderCircle size={17} className="spin" />
                    ) : (
                      <ArrowRight size={17} />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.section>
            <motion.section
              className="quick-tools-section"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.6 }}
            >
              <div className="section-heading">
                <h2>
                  Your everyday little superpowers
                  <span className="heading-dot">.</span>
                </h2>
                <button type="button" onClick={() => openOverlay("search")}>
                  Explore all {tools.length} tools
                  <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="quick-tools">
                {[
                  {
                    id: "base64",
                    subtitle: "A universal language.",
                    color: "lilac",
                  },
                  { id: "url", subtitle: "Made for the web.", color: "blue" },
                  {
                    id: "sha256",
                    subtitle: "A unique fingerprint.",
                    color: "peach",
                  },
                  {
                    id: "jsonPretty",
                    subtitle: "A little more structure.",
                    color: "mint",
                  },
                ].map((item, index) => (
                  <motion.button
                    type="button"
                    key={item.id}
                    className={`quick-tool glass ${item.color} ${toolId === item.id ? "quick-active" : ""}`}
                    onClick={() => selectTool(item.id)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 360, damping: 25 }}
                    initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="quick-tool-icon">
                      <ToolIcon tool={getTool(item.id)} size={21} />
                    </span>
                    <span className="quick-tool-text">
                      <strong>
                        {item.id === "jsonPretty"
                          ? "JSON formatter"
                          : getTool(item.id).name}
                      </strong>
                      <span>{item.subtitle}</span>
                    </span>
                    <ArrowUpRight size={14} className="quick-tool-arrow" />
                    <span className="quick-number">0{index + 1}</span>
                  </motion.button>
                ))}
              </div>
            </motion.section>
            <footer className="workspace-footer">
              <span>
                Thoughtfully made for curious minds
                <span className="footer-heart">
                  <Heart size={11} />
                </span>
              </span>
              <span className="footer-right">
                <LockKeyhole size={12} />
                Private by nature.
                <span className="footer-separator" />
                &copy; {new Date().getFullYear()} AshCrypt
              </span>
            </footer>
          </main>
        </div>
        <input
          ref={uploadRef}
          type="file"
          className="hidden-file-input"
          accept="text/*,.json,.xml,.csv,.md,.log,.yaml,.yml,.html,.svg"
          onChange={(event) => void importFile(event)}
          aria-label="Import text file"
          tabIndex={-1}
        />
        <div className="sr-only" role="status" aria-live="polite">
          {busy
            ? "Converting text"
            : output
              ? `Conversion complete. ${outputMetrics.characters} output characters.`
              : ""}
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className={`toast glass toast-${toast.type}`}
              role={toast.type === "error" ? "alert" : "status"}
              initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
              exit={{ opacity: 0, y: 10, x: "-50%", scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <span className="toast-icon">
                {toast.type === "error" ? (
                  <CircleAlert size={17} />
                ) : toast.type === "success" ? (
                  <Check size={17} />
                ) : (
                  <Sparkles size={17} />
                )}
              </span>
              <span>{toast.text}</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {overlay && (
            <Modal
              key={overlay}
              title={
                overlay === "search"
                  ? "Find your little superpower."
                  : overlay === "favorites"
                    ? "Your favorites, a little closer."
                    : overlay === "history"
                      ? "A little trip back."
                      : overlay === "settings"
                        ? "Make this space yours."
                        : overlay === "guide"
                          ? "A little guidance."
                          : overlay === "input"
                            ? "Room for your thoughts."
                            : "The bigger picture."
              }
              onClose={closeOverlay}
              className={
                overlay === "history"
                  ? "history-modal"
                  : overlay === "input" || overlay === "output"
                    ? "expanded-modal"
                    : overlay === "search" || overlay === "favorites"
                      ? "search-modal"
                      : ""
              }
            >
              {(overlay === "search" || overlay === "favorites") && (
                <>
                  <p className="modal-description">
                    {overlay === "favorites"
                      ? "Pin any tool with its star. Your go-tos, always within reach."
                      : "One thoughtful toolkit. Plenty of possibilities."}
                  </p>
                  <div className="command-search">
                    <Search size={19} />
                    <input
                      data-autofocus
                      aria-label="Search all tools"
                      placeholder="What would you like to do?"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && searchResults[0]) {
                          selectTool(searchResults[0].id);
                          closeOverlay();
                        }
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          document
                            .querySelector<HTMLButtonElement>(
                              ".command-result-main",
                            )
                            ?.focus();
                        }
                      }}
                    />
                    <kbd>esc</kbd>
                  </div>
                  <div className="command-results">
                    {categories.map((group) => {
                      const groupTools = searchResults.filter(
                        (item) => item.category === group.id,
                      );
                      return (
                        groupTools.length > 0 && (
                          <div className="command-group" key={group.id}>
                            <h3>
                              {group.short}
                              <span>{groupTools.length}</span>
                            </h3>
                            {groupTools.map((item) => (
                              <div
                                className={`command-result ${item.id === toolId ? "current-tool" : ""}`}
                                key={item.id}
                              >
                                <button
                                  className="command-result-main"
                                  type="button"
                                  onClick={() => {
                                    selectTool(item.id);
                                    closeOverlay();
                                  }}
                                >
                                  <span
                                    className={`command-tool-icon pin-${item.category}`}
                                  >
                                    <ToolIcon tool={item} />
                                  </span>
                                  <span>
                                    <strong>{item.name}</strong>
                                    <small>{item.description}</small>
                                  </span>
                                  {item.id === toolId && <Check size={16} />}
                                </button>
                                <button
                                  type="button"
                                  className={`icon-button command-star ${favorites.includes(item.id) ? "favorited" : ""}`}
                                  onClick={() => toggleFavorite(item.id)}
                                  aria-label={`${favorites.includes(item.id) ? "Unpin" : "Pin"} ${item.name}`}
                                >
                                  <Star
                                    size={16}
                                    fill={
                                      favorites.includes(item.id)
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      );
                    })}
                    {searchResults.length === 0 && (
                      <div className="modal-empty">
                        <Search size={29} strokeWidth={1.2} />
                        <h3>
                          {overlay === "favorites" && !query
                            ? "Your favorites are waiting to happen."
                            : "Nothing here just yet."}
                        </h3>
                        <p>
                          {overlay === "favorites" && !query
                            ? "Explore the toolkit and star a tool you love."
                            : "Try a different word. A new possibility might be waiting."}
                        </p>
                        {overlay === "favorites" && (
                          <button
                            type="button"
                            className="soft-button"
                            onClick={() => openOverlay("search")}
                          >
                            Explore the tools
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="command-footer">
                    <span>
                      <CornerDownLeft size={12} />
                      to open the first match
                    </span>
                    <span>
                      <Star size={12} />
                      to keep it close
                    </span>
                  </div>
                </>
              )}
              {overlay === "history" && (
                <>
                  <p className="modal-description">
                    Your last 20 transformations. This tab only.
                  </p>
                  <div className="history-controls">
                    <span className="session-label">
                      <span />
                      {saveHistory
                        ? "Private session history"
                        : "Session history is paused"}
                    </span>
                    <button
                      type="button"
                      className="text-icon-button"
                      disabled={!history.length}
                      onClick={() => {
                        setHistory([]);
                        notify(
                          "History cleared. Just the present, now.",
                          "info",
                        );
                      }}
                    >
                      <Trash2 size={13} />
                      Clear history
                    </button>
                  </div>
                  <div className="history-list">
                    {history.length ? (
                      history.map((entry) => (
                        <div className="history-entry" key={entry.id}>
                          <button
                            type="button"
                            className="restore-history"
                            onClick={() => restoreEntry(entry)}
                          >
                            <div className="history-entry-top">
                              <span className="history-tool">
                                <ToolIcon
                                  tool={getTool(entry.toolId)}
                                  size={17}
                                />
                                <strong>{getTool(entry.toolId).name}</strong>
                              </span>
                              <time>
                                {new Intl.DateTimeFormat(undefined, {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }).format(entry.time)}
                              </time>
                            </div>
                            <code>{entry.input || "(empty text)"}</code>
                            <div className="history-entry-bottom">
                              <span>
                                {getTool(entry.toolId).category === "hashes"
                                  ? "Hashed"
                                  : getTool(entry.toolId).category ===
                                      "formatters"
                                    ? "Formatted / validated"
                                    : entry.action === "encode"
                                      ? "Encoded"
                                      : "Decoded"}
                                <span>&middot;</span>
                                {characterCount(
                                  entry.output,
                                ).toLocaleString()}{" "}
                                characters
                              </span>
                              <span>
                                Restore
                                <ArrowUpRight size={12} />
                              </span>
                            </div>
                          </button>
                          <button
                            className="icon-button delete-history"
                            type="button"
                            aria-label={`Delete ${getTool(entry.toolId).name} history entry`}
                            onClick={() =>
                              setHistory((previous) =>
                                previous.filter((item) => item.id !== entry.id),
                              )
                            }
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="modal-empty history-empty">
                        <div className="empty-history-symbol">
                          <Clock3 size={34} strokeWidth={1.2} />
                        </div>
                        <h3>A lovely, clean slate.</h3>
                        <p>
                          Your transformations will appear here.
                          <br />
                          Only in this tab. Never on a server.
                        </p>
                        <button
                          type="button"
                          className="soft-button"
                          onClick={closeOverlay}
                        >
                          Make a little something
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="history-privacy">
                    <LockKeyhole size={13} />
                    Closing this tab ends your history session. Large results
                    over 100k characters are not saved.
                  </div>
                </>
              )}
              {overlay === "settings" && (
                <>
                  <p className="modal-description">
                    A few little preferences. A workspace that feels like you.
                  </p>
                  <div className="setting-block">
                    <div className="setting-label">
                      <span>Set the mood</span>
                      <p>
                        A little light, a little dark, or in step with your
                        device.
                      </p>
                    </div>
                    <div className="appearance-options">
                      {(
                        [
                          { id: "light", name: "Light", Icon: Sun },
                          { id: "dark", name: "Dark", Icon: Moon },
                          { id: "system", name: "System", Icon: Laptop },
                        ] as const
                      ).map(({ id, name, Icon }) => (
                        <button
                          type="button"
                          key={id}
                          className={theme === id ? "active" : ""}
                          onClick={() => setTheme(id)}
                          aria-pressed={theme === id}
                        >
                          <Icon size={21} strokeWidth={1.5} />
                          <span>{name}</span>
                          {theme === id && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>Smart format detection</strong>
                      <p>Recognize common encodings in Decode mode.</p>
                    </div>
                    <Toggle
                      label="Enable smart format detection"
                      checked={autoDetect}
                      onChange={() => {
                        skipDetection.current = null;
                        setAutoDetect(!autoDetect);
                      }}
                    />
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>Live transformations</strong>
                      <p>A little pause in typing, and your result is ready.</p>
                    </div>
                    <Toggle
                      label="Enable live transformations"
                      checked={live}
                      onChange={() => setLive(!live)}
                    />
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>Remember this session</strong>
                      <p>
                        Keep up to 20 results, only for the life of this tab.
                      </p>
                    </div>
                    <Toggle
                      label="Save session history"
                      checked={saveHistory}
                      onChange={() => {
                        if (saveHistory) setHistory([]);
                        setSaveHistory(!saveHistory);
                      }}
                    />
                  </div>
                  <div className="settings-privacy">
                    <ShieldCheck size={21} strokeWidth={1.5} />
                    <p>
                      Settings and pinned tools stay on your device. Your text
                      is never sent anywhere. Ever.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="primary-button modal-done"
                    onClick={closeOverlay}
                  >
                    Just right
                    <Check size={16} />
                  </button>
                  <p className="settings-credit">AshCrypt 2.0. Precision tools by Akhil Rashed.</p>
                </>
              )}
              {overlay === "guide" && (
                <>
                  <p className="modal-description">
                    Small tools should feel effortless. Here's a little head
                    start.
                  </p>
                  <div className="guide-tabs">
                    {[
                      { id: "start", title: "Getting started" },
                      { id: "shortcuts", title: "Shortcuts" },
                      { id: "privacy", title: "Privacy" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={guideTab === tab.id ? "active" : ""}
                        onClick={() => setGuideTab(tab.id)}
                      >
                        {tab.title}
                      </button>
                    ))}
                  </div>
                  <div className="guide-content">
                    {guideTab === "start" && (
                      <>
                        <div className="guide-step">
                          <span>01</span>
                          <div>
                            <h3>Pick your little superpower.</h3>
                            <p>
                              Choose a format, hash, or formatter. Find all 25
                              tools with the search button, or pin a favorite
                              using its star.
                            </p>
                          </div>
                        </div>
                        <div className="guide-step">
                          <span>02</span>
                          <div>
                            <h3>A little input. A little magic.</h3>
                            <p>
                              Type, paste, or open a local text file up to 1 MB.
                              Choose Encode or Decode, then transform. Live mode
                              updates as you type.
                            </p>
                          </div>
                        </div>
                        <div className="guide-step">
                          <span>03</span>
                          <div>
                            <h3>Let smart detection lend a hand.</h3>
                            <p>
                              In Decode mode, we recognize common encodings.
                              JSON and XML are detected in formatter mode. Your
                              script is identified too, with full Unicode
                              support.
                            </p>
                          </div>
                        </div>
                        <div className="guide-callout">
                          <WandSparkles size={17} />
                          <p>
                            Detection is a helpful guess, not a guarantee.
                            Base58, ROT13, and hashes cannot be reliably
                            identified automatically. A manual format selection
                            always takes priority for the current input.
                          </p>
                        </div>
                        <div className="guide-callout legacy-callout">
                          <Fingerprint size={17} />
                          <p>
                            Encoding is not encryption. Hashes cannot be
                            decoded. MD5 and SHA-1 are legacy checksum tools,
                            not safe choices for passwords or new security
                            systems.
                          </p>
                        </div>
                      </>
                    )}
                    {guideTab === "shortcuts" && (
                      <div className="shortcut-list">
                        {[
                          {
                            label: "Find any tool",
                            keys: [isMac ? "Cmd" : "Ctrl", "K"],
                          },
                          {
                            label: "Transform your text",
                            keys: [isMac ? "Cmd" : "Ctrl", "Enter"],
                          },
                          {
                            label: "Copy your result",
                            keys: [isMac ? "Cmd" : "Ctrl", "Shift", "Enter"],
                          },
                          { label: "Close a window", keys: ["Esc"] },
                          { label: "Move between controls", keys: ["Tab"] },
                        ].map((shortcut) => (
                          <div key={shortcut.label}>
                            <span>{shortcut.label}</span>
                            <span>
                              {shortcut.keys.map((key) => (
                                <kbd key={key}>{key}</kbd>
                              ))}
                            </span>
                          </div>
                        ))}
                        <p className="shortcut-note">
                          <Keyboard size={15} />
                          Less reaching. More flow.
                        </p>
                      </div>
                    )}
                    {guideTab === "privacy" && (
                      <div className="privacy-guide">
                        <ShieldCheck size={44} strokeWidth={1.1} />
                        <h3>A private space. Not just a promise.</h3>
                        <p>
                          Every transformation happens in your browser. There is
                          no conversion server, account, analytics, or text
                          upload. Files are opened locally, never sent
                          elsewhere.
                        </p>
                        <p>
                          Only your preferences and pinned tools are stored
                          long-term. Optional history lives in this tab's
                          session storage and can be cleared anytime. Browser
                          session-restore features may restore a previous tab's
                          history.
                        </p>
                        <p>
                          Your work is not saved when you leave. There are no
                          exit popups, redirects, or surprise downloads.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {(overlay === "input" || overlay === "output") && (
                <>
                  <p className="modal-description">
                    {overlay === "input"
                      ? "A little more room to think. Changes stay in your workspace."
                      : `${tool.name} output. All ${outputMetrics.characters.toLocaleString()} characters of it.`}
                  </p>
                  <textarea
                    data-autofocus
                    className="expanded-textarea"
                    aria-label={
                      overlay === "input"
                        ? "Expanded input text"
                        : "Expanded output text"
                    }
                    value={overlay === "input" ? input : output}
                    readOnly={overlay === "output"}
                    spellCheck={false}
                    maxLength={1_000_000}
                    onChange={(event) => {
                      if (overlay === "input") updateInput(event.target.value);
                    }}
                    placeholder={
                      overlay === "input"
                        ? "Make room for a little possibility..."
                        : "Your transformed text will appear here."
                    }
                  />
                  <div className="expanded-footer">
                    <span>
                      {textStats(overlay === "input" ? input : output)}
                    </span>
                    {overlay === "input" ? (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {
                          closeOverlay();
                          void runConversion();
                        }}
                      >
                        {primaryLabel}
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="primary-button"
                        disabled={!output}
                        onClick={() => void copyOutput()}
                      >
                        {copied ? "Copied" : "Copy output"}
                        {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
                      </button>
                    )}
                  </div>
                </>
              )}
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
