import { md5, sha1 } from "@noble/hashes/legacy.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import {
  base32,
  base32nopad,
  base58,
  base64,
  base64nopad,
  base64url,
  base64urlnopad,
  hex,
} from "@scure/base";
import { decodeHTML, escapeUTF8 } from "entities";
import { XMLValidator } from "fast-xml-parser";

export type Category = "encodings" | "hashes" | "formatters" | "network";
export type Action = "encode" | "decode";

export interface Tool {
  id: string;
  name: string;
  category: Category;
  description: string;
  example: string;
  tag?: string;
}

const greeting = "Hello, world! A little text, a lot of possibility.";
const jsonExample =
  '{"hello":"world","madeWith":"AshCrypt","possibilities":["a little clarity","a little magic"],"private":true}';
const xmlExample =
  "<note><to>World</to><message>A little text, a lot of possibility.</message><from>AshCrypt</from></note>";

export const categories: {
  id: Category;
  name: string;
  short: string;
  description: string;
}[] = [
  {
    id: "encodings",
    name: "Encode / Decode",
    short: "Text encodings",
    description: "A fresh perspective on every character.",
  },
  {
    id: "hashes",
    name: "Hash generator",
    short: "Hash functions",
    description: "A dependable fingerprint for your text.",
  },
  {
    id: "formatters",
    name: "JSON & XML",
    short: "JSON & XML",
    description: "A little structure. A lot more clarity.",
  },
  {
    id: "network",
    name: "Network & web",
    short: "Network & web",
    description: "Small, useful tools for a connected world.",
  },
];

export const tools: Tool[] = [
  {
    id: "base64",
    name: "Base64",
    category: "encodings",
    description: "Universal encoding. Endless applications.",
    example: greeting,
    tag: "POPULAR",
  },
  {
    id: "url",
    name: "URL encoding",
    category: "encodings",
    description: "Make every character web-friendly.",
    example: "Hello, world! coffee & a little curiosity",
  },
  {
    id: "binary",
    name: "Binary",
    category: "encodings",
    description: "Your text, in ones and zeros. UTF-8 safe.",
    example: "Hello, world!",
  },
  {
    id: "hex",
    name: "Hexadecimal",
    category: "encodings",
    description: "Compact, lowercase UTF-8 hex bytes.",
    example: "Hello, world!",
  },
  {
    id: "htmlEntities",
    name: "HTML entities",
    category: "encodings",
    description: "Escape markup. Decode named and numeric entities.",
    example: '<hello title="world">A & B</hello>',
  },
  {
    id: "ascii",
    name: "ASCII",
    category: "encodings",
    description: "Convert 7-bit ASCII to decimal character codes.",
    example: "Hello, world!",
  },
  {
    id: "utf8",
    name: "UTF-8 bytes",
    category: "encodings",
    description: "Percent-prefixed UTF-8 bytes, for every language.",
    example: "Hello, caf\u00e9!",
  },
  {
    id: "utf16le",
    name: "UTF-16 little endian",
    category: "encodings",
    description: "Little-endian hex bytes, including surrogate pairs.",
    example: "Hello, caf\u00e9! \u4f60\u597d",
  },
  {
    id: "utf16be",
    name: "UTF-16 big endian",
    category: "encodings",
    description: "Big-endian hex bytes, including surrogate pairs.",
    example: "Hello, caf\u00e9! \u4f60\u597d",
  },
  {
    id: "decimal",
    name: "Unicode decimal",
    category: "encodings",
    description: "Space-separated Unicode code points.",
    example: "Hello, caf\u00e9! \u4f60\u597d",
  },
  {
    id: "rot13",
    name: "ROT13",
    category: "encodings",
    description: "A playful, reversible shift of the Latin alphabet.",
    example: "A little secret, just for you.",
  },
  {
    id: "md5",
    name: "MD5",
    category: "hashes",
    description: "A real 128-bit digest. Legacy checksums only.",
    example: greeting,
    tag: "LEGACY",
  },
  {
    id: "sha1",
    name: "SHA-1",
    category: "hashes",
    description: "A real 160-bit digest. Legacy checksums only.",
    example: greeting,
    tag: "LEGACY",
  },
  {
    id: "sha256",
    name: "SHA-256",
    category: "hashes",
    description: "A reliable, 256-bit fingerprint for your text.",
    example: greeting,
    tag: "RECOMMENDED",
  },
  {
    id: "sha512",
    name: "SHA-512",
    category: "hashes",
    description: "A full, 512-bit fingerprint for your text.",
    example: greeting,
  },
  {
    id: "jsonPretty",
    name: "JSON formatter",
    category: "formatters",
    description: "Give your JSON a little breathing room.",
    example: jsonExample,
  },
  {
    id: "jsonMinify",
    name: "JSON minifier",
    category: "formatters",
    description: "The same JSON, without the extra space.",
    example: jsonExample,
  },
  {
    id: "jsonValidate",
    name: "JSON validator",
    category: "formatters",
    description: "Find out whether your JSON is well-formed.",
    example: jsonExample,
  },
  {
    id: "xmlPretty",
    name: "XML formatter",
    category: "formatters",
    description: "Readable XML, with mixed content kept intact.",
    example: xmlExample,
  },
  {
    id: "xmlMinify",
    name: "XML minifier",
    category: "formatters",
    description: "Remove indentation, not meaningful text.",
    example: xmlExample,
  },
  {
    id: "xmlValidate",
    name: "XML validator",
    category: "formatters",
    description: "Check your XML, with useful error locations.",
    example: xmlExample,
  },
  {
    id: "urlDecodeAll",
    name: "Deep URL decode",
    category: "network",
    description: "Unwrap multiple layers of URL encoding.",
    example: "Hello%252C%2520world%2521",
  },
  {
    id: "base32",
    name: "Base32",
    category: "network",
    description: "RFC 4648 Base32, with optional decode padding.",
    example: "Hello, world!",
  },
  {
    id: "base58",
    name: "Base58",
    category: "network",
    description: "Real Bitcoin-alphabet Base58. No lookalikes.",
    example: "Hello, world!",
  },
  {
    id: "base64url",
    name: "Base64 URL-safe",
    category: "network",
    description: "Unpadded, URL-safe Base64 for the web.",
    example: greeting,
  },
];

export const getTool = (id: string): Tool =>
  tools.find((tool) => tool.id === id) ?? tools[0];
export const byteCount = (text: string) =>
  new TextEncoder().encode(text).length;
export const characterCount = (text: string) => {
  let count = 0;
  for (const _character of text) count++;
  return count;
};

function fromBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    throw new Error(
      "These bytes are not valid UTF-8 text. Check the selected format.",
    );
  }
}

function readHex(input: string): Uint8Array {
  const value = input.replace(/\s+/g, "");
  if (!value || !/^[\da-f]+$/i.test(value) || value.length % 2 !== 0) {
    throw new Error(
      "Use an even number of hexadecimal characters (0-9 and A-F). Spaces are welcome.",
    );
  }
  return hex.decode(value);
}

function readNumbers(input: string, limit: number): number[] {
  if (!/^\s*\d+(?:\s+\d+)*\s*$/.test(input)) {
    throw new Error(
      "Separate decimal character codes with spaces, for example: 72 101 108 108 111.",
    );
  }
  return input
    .trim()
    .split(/\s+/)
    .map((part) => {
      const value = Number(part);
      if (
        !Number.isSafeInteger(value) ||
        value > limit ||
        (value >= 0xd800 && value <= 0xdfff)
      ) {
        throw new Error(
          `Each code must be a valid character between 0 and ${limit}.`,
        );
      }
      return value;
    });
}

function parseXml(input: string): XMLDocument {
  if (/<!ENTITY\s/i.test(input))
    throw new Error(
      "Custom XML entities are disabled for safety. Use standard XML entities instead.",
    );
  const validation = XMLValidator.validate(input);
  if (validation !== true)
    throw new Error(
      `Invalid XML at line ${validation.err.line}, column ${validation.err.col}: ${validation.err.msg}`,
    );
  const doc = new DOMParser().parseFromString(input, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error(
      doc
        .getElementsByTagName("parsererror")[0]
        .textContent?.trim()
        .slice(0, 240) || "Invalid XML.",
    );
  }
  return doc;
}

// Only discard indentation in element-only content. Mixed text and xml:space are data.
function serializeXml(doc: XMLDocument, pretty: boolean): string {
  const serializer = new XMLSerializer();
  const visit = (node: Node, depth: number, inheritedSpace = false): string => {
    if (node.nodeType !== 1) return serializer.serializeToString(node);
    const element = node as Element;
    const space = element.getAttribute("xml:space");
    const preserve =
      space === "preserve" || (inheritedSpace && space !== "default");
    const children = Array.from(node.childNodes);
    const mixed = children.some(
      (child) =>
        child.nodeType === 4 ||
        (child.nodeType === 3 && !!child.nodeValue?.trim()),
    );
    if (preserve || mixed || !children.length)
      return serializer.serializeToString(node);
    const useful = children.filter(
      (child) => child.nodeType !== 3 || !!child.nodeValue?.trim(),
    );
    const shallow = serializer.serializeToString(node.cloneNode(false));
    if (!useful.length) return shallow;
    const open = shallow
      .replace(/\s*\/>$/, ">")
      .replace(new RegExp(`</${element.tagName}>$`), "");
    const close = `</${element.tagName}>`;
    if (!pretty)
      return (
        open +
        useful.map((child) => visit(child, depth + 1, preserve)).join("") +
        close
      );
    return (
      open +
      "\n" +
      useful
        .map(
          (child) => "  ".repeat(depth + 1) + visit(child, depth + 1, preserve),
        )
        .join("\n") +
      "\n" +
      "  ".repeat(depth) +
      close
    );
  };
  return Array.from(doc.childNodes)
    .filter((node) => node.nodeType !== 3 || !!node.nodeValue?.trim())
    .map((node) => visit(node, 0))
    .join(pretty ? "\n" : "");
}

export function convert(input: string, toolId: string, action: Action): string {
  const tool = tools.find((item) => item.id === toolId);
  if (!tool)
    throw new Error("That tool is not available. Please select another one.");
  if (!input.length && tool.category !== "hashes")
    throw new Error(
      "A little text first. Type or paste something into the input.",
    );
  if (input.length > 1_000_000)
    throw new Error("Please keep your input under 1 million characters.");
  const encoding = action === "encode";
  const bytes = new TextEncoder().encode(input);
  const clean = input.replace(/\s+/g, "");
  if (
    !encoding &&
    !clean &&
    ["base64", "base64url", "base32", "base58", "binary"].includes(toolId)
  )
    throw new Error("Enter at least one complete encoded value to decode.");
  switch (toolId) {
    case "base64":
      return encoding
        ? base64.encode(bytes)
        : fromBytes((clean.includes("=") ? base64 : base64nopad).decode(clean));
    case "base64url":
      return encoding
        ? base64urlnopad.encode(bytes)
        : fromBytes(
            (clean.includes("=") ? base64url : base64urlnopad).decode(clean),
          );
    case "base32": {
      if (encoding) return base32.encode(bytes);
      const upper = clean.toUpperCase();
      return fromBytes(
        (upper.includes("=") ? base32 : base32nopad).decode(upper),
      );
    }
    case "base58":
      if (
        (encoding && bytes.length > 2048) ||
        (!encoding && clean.length > 4096)
      )
        throw new Error(
          "Base58 works best with small values. Use at most 2 KB of text or 4,096 encoded characters.",
        );
      return encoding ? base58.encode(bytes) : fromBytes(base58.decode(clean));
    case "url":
      try {
        return encoding ? encodeURIComponent(input) : decodeURIComponent(input);
      } catch {
        throw new Error(
          "This URL encoding is incomplete or invalid. Check percent escapes such as %20.",
        );
      }
    case "urlDecodeAll": {
      if (encoding) throw new Error("Deep URL decode only supports decoding.");
      let value = input;
      for (let layer = 0; layer < 32; layer++) {
        if (!/%[\da-f]{2}/i.test(value)) {
          if (layer === 0 && /%/.test(value))
            throw new Error("This text contains an invalid percent escape.");
          return value;
        }
        let next: string;
        try {
          next = decodeURIComponent(value);
        } catch {
          throw new Error("A URL encoding layer is incomplete or invalid.");
        }
        if (next === value) return value;
        value = next;
      }
      if (/%[\da-f]{2}/i.test(value))
        throw new Error(
          "More than 32 encoding layers detected. Decode again in smaller steps.",
        );
      return value;
    }
    case "hex":
      return encoding ? hex.encode(bytes) : fromBytes(readHex(input));
    case "binary": {
      if (encoding)
        return Array.from(bytes, (byte) =>
          byte.toString(2).padStart(8, "0"),
        ).join(" ");
      if (!/^[01\s]+$/.test(input) || clean.length % 8 !== 0)
        throw new Error(
          "Use complete 8-bit binary bytes, for example: 01001000 01101001.",
        );
      return fromBytes(
        new Uint8Array(
          (clean.match(/.{8}/g) || []).map((part) => parseInt(part, 2)),
        ),
      );
    }
    case "htmlEntities":
      return encoding ? escapeUTF8(input) : decodeHTML(input);
    case "ascii":
      if (encoding) {
        if (/[^\x00-\x7f]/.test(input))
          throw new Error(
            "ASCII supports characters 0-127 only. Choose UTF-8 or Unicode decimal for other languages.",
          );
        return Array.from(input, (char) => char.charCodeAt(0)).join(" ");
      }
      return readNumbers(input, 127)
        .map((code) => String.fromCharCode(code))
        .join("");
    case "utf8": {
      if (encoding)
        return Array.from(
          bytes,
          (byte) => "%" + byte.toString(16).padStart(2, "0"),
        ).join("");
      if (!/^(?:%[\da-f]{2})+$/i.test(clean))
        throw new Error(
          "Use percent-prefixed UTF-8 bytes, for example: %48%69.",
        );
      return fromBytes(readHex(clean.replace(/%/g, "")));
    }
    case "utf16le":
    case "utf16be": {
      const isLE = toolId === "utf16le";
      if (encoding) {
        const result: string[] = [];
        for (let i = 0; i < input.length; i++) {
          const value = input.charCodeAt(i).toString(16).padStart(4, "0");
          result.push(isLE ? value.slice(2) + value.slice(0, 2) : value);
        }
        return result.join("");
      }
      if (clean.length % 4 !== 0 || !/^[\da-f]+$/i.test(clean))
        throw new Error(
          "UTF-16 hex needs complete four-character groups, for example: 48006900.",
        );
      return (clean.match(/.{4}/g) || [])
        .map((part) =>
          String.fromCharCode(
            parseInt(isLE ? part.slice(2) + part.slice(0, 2) : part, 16),
          ),
        )
        .join("");
    }
    case "decimal":
      return encoding
        ? Array.from(input, (char) => char.codePointAt(0)).join(" ")
        : readNumbers(input, 0x10ffff)
            .map((code) => String.fromCodePoint(code))
            .join("");
    case "rot13":
      return input.replace(/[a-z]/gi, (char) =>
        String.fromCharCode(
          char.charCodeAt(0) + (char.toLowerCase() <= "m" ? 13 : -13),
        ),
      );
    case "md5":
    case "sha1":
    case "sha256":
    case "sha512": {
      if (!encoding)
        throw new Error(
          "Hashes are one-way fingerprints. They cannot be decoded.",
        );
      return hex.encode({ md5, sha1, sha256, sha512 }[toolId](bytes));
    }
    case "jsonPretty":
    case "jsonMinify":
    case "jsonValidate": {
      let value: unknown;
      try {
        value = JSON.parse(input);
      } catch (error) {
        throw new Error(
          `Invalid JSON: ${error instanceof Error ? error.message : "Check the syntax."}`,
        );
      }
      if (toolId === "jsonValidate")
        return "Valid JSON. Everything is in the right place.";
      return JSON.stringify(
        value,
        null,
        toolId === "jsonPretty" ? 2 : undefined,
      );
    }
    case "xmlPretty":
    case "xmlMinify":
    case "xmlValidate": {
      const doc = parseXml(input);
      if (toolId === "xmlValidate")
        return "Valid XML. Everything is in the right place.";
      return serializeXml(doc, toolId === "xmlPretty");
    }
    default:
      throw new Error("Please select a supported tool.");
  }
}

export interface Detection {
  label: string;
  toolId: string | null;
  confidence: "high" | "likely" | "none";
}

function readable(value: string): boolean {
  return (
    value.length > 0 && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/.test(value)
  );
}

export function detectInput(input: string): Detection {
  const trimmed = input.trim();
  const plain: Detection = {
    label: "Plain text",
    toolId: null,
    confidence: "none",
  };
  if (!trimmed) return plain;
  if (/^[\[{]/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return { label: "JSON", toolId: "jsonPretty", confidence: "high" };
    } catch {
      /* Keep looking for another format. */
    }
  }
  if (
    /^(?:<\?xml[^>]*>\s*)?<([\w:-]+)(?:\s[^>]*|)>/.test(trimmed) &&
    XMLValidator.validate(trimmed) === true
  )
    return { label: "XML", toolId: "xmlPretty", confidence: "high" };
  if (
    /^[01\s]+$/.test(trimmed) &&
    trimmed.replace(/\s/g, "").length >= 8 &&
    trimmed.replace(/\s/g, "").length % 8 === 0
  )
    return { label: "Binary", toolId: "binary", confidence: "high" };
  if (/^(?:%[\da-f]{2})+$/i.test(trimmed))
    return { label: "UTF-8 bytes", toolId: "utf8", confidence: "high" };
  if (/%[\da-f]{2}/i.test(trimmed))
    return {
      label: "URL encoded",
      toolId: /%25[\da-f]{2}/i.test(trimmed) ? "urlDecodeAll" : "url",
      confidence: "high",
    };
  if (/&(?:#[0-9]+|#x[\da-f]+|[a-z][a-z\d]+);/i.test(trimmed))
    return {
      label: "HTML entities",
      toolId: "htmlEntities",
      confidence: "high",
    };
  if (/^\d+(?:\s+\d+)+$/.test(trimmed))
    return { label: "Decimal codes", toolId: "decimal", confidence: "likely" };
  const compact = trimmed.replace(/\s/g, "");
  if (
    compact.length >= 4 &&
    compact.length % 2 === 0 &&
    /^[\da-f]+$/i.test(compact)
  ) {
    if (/^(?:[\da-f]{2}00){2,}/i.test(compact) || /^fffe/i.test(compact))
      return { label: "UTF-16 LE", toolId: "utf16le", confidence: "likely" };
    if (/^(?:00[\da-f]{2}){2,}/i.test(compact) || /^feff/i.test(compact))
      return { label: "UTF-16 BE", toolId: "utf16be", confidence: "likely" };
    try {
      if (readable(convert(compact, "hex", "decode")))
        return { label: "Hexadecimal", toolId: "hex", confidence: "likely" };
    } catch {
      /* A hex-shaped value is not necessarily text. */
    }
  }
  if (compact.length >= 4) {
    for (const [id, pattern] of [
      ["base32", /^[A-Z2-7]+={0,6}$/],
      ["base64", /^[A-Za-z\d+/]+={0,2}$/],
      ["base64url", /^[A-Za-z\d_-]+={0,2}$/],
    ] as const) {
      if (!pattern.test(compact)) continue;
      try {
        if (readable(convert(compact, id, "decode")))
          return { label: getTool(id).name, toolId: id, confidence: "likely" };
      } catch {
        /* Overlapping alphabets need a successful UTF-8 decode. */
      }
    }
  }
  if (/[\u0600-\u06ff]/.test(trimmed))
    return { ...plain, label: "Arabic text" };
  if (/[\u3040-\u30ff]/.test(trimmed))
    return { ...plain, label: "Japanese text" };
  if (/[\uac00-\ud7af]/.test(trimmed))
    return { ...plain, label: "Korean text" };
  if (/[\u4e00-\u9fff]/.test(trimmed))
    return { ...plain, label: "Chinese text" };
  if (/[\u0400-\u04ff]/.test(trimmed))
    return { ...plain, label: "Cyrillic text" };
  if (/[\u0900-\u097f]/.test(trimmed))
    return { ...plain, label: "Devanagari text" };
  if (/[\u0590-\u05ff]/.test(trimmed))
    return { ...plain, label: "Hebrew text" };
  if (/[^\x00-\x7f]/.test(trimmed)) return { ...plain, label: "Unicode text" };
  return plain;
}

export function exampleFor(tool: Tool, action: Action): string {
  if (
    tool.id === "urlDecodeAll" ||
    tool.category === "hashes" ||
    tool.category === "formatters" ||
    action === "encode"
  )
    return tool.example;
  return convert(tool.example, tool.id, "encode");
}
