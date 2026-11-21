import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  byteCount,
  characterCount,
  convert,
  detectInput,
  exampleFor,
  getTool,
  tools,
} from "../src/lib/conversions";

const unicode =
  "Hello, caf\u00e9! \u0645\u0631\u062d\u0628\u0627 \u4f60\u597d \ud83d\udc9c \ud83c\udf0d";
const reversible = tools.filter(
  (tool) =>
    ["encodings", "network"].includes(tool.category) &&
    !["urlDecodeAll", "ascii"].includes(tool.id),
);

for (const tool of reversible) {
  test(`${tool.name} round-trips ASCII and Unicode without losing bytes`, () => {
    for (const input of [
      "Hello, world!",
      unicode,
      "\0A\n\tB\r\n",
      "\ufeffHello",
    ]) {
      const encoded = convert(input, tool.id, "encode");
      assert.equal(convert(encoded, tool.id, "decode"), input);
    }
  });
}

for (const id of ["md5", "sha1", "sha256", "sha512"]) {
  test(`${id} matches reference hashes, including empty input`, () => {
    for (const input of ["", "abc", unicode])
      assert.equal(
        convert(input, id, "encode"),
        createHash(id).update(input).digest("hex"),
      );
    assert.throws(() => convert("abc", id, "decode"), /cannot be decoded/);
  });
}

test("Base58 uses the real Bitcoin alphabet and preserves leading zeroes", () => {
  assert.equal(convert("Hello World", "base58", "encode"), "JxF12TrwUP45BMd");
  assert.equal(convert("\0\0hello", "base58", "encode").slice(0, 2), "11");
  assert.throws(() => convert("a".repeat(2049), "base58", "encode"), /2 KB/);
  assert.throws(() => convert("0OIl", "base58", "decode"));
});

test("ASCII is strict and has a real inverse", () => {
  assert.equal(convert("Hi!", "ascii", "encode"), "72 105 33");
  assert.equal(convert("72 105 33", "ascii", "decode"), "Hi!");
  assert.throws(() => convert(unicode, "ascii", "encode"), /ASCII supports/);
  assert.throws(() => convert("256", "ascii", "decode"));
});

test("UTF-16 keeps astral surrogate pairs in both endiannesses", () => {
  assert.equal(convert("\ud83d\udc9c", "utf16le", "encode"), "3dd89cdc");
  assert.equal(convert("\ud83d\udc9c", "utf16be", "encode"), "d83ddc9c");
  assert.equal(convert("128156", "decimal", "decode"), "\ud83d\udc9c");
  assert.throws(() => convert("1f49c", "decimal", "decode"));
});

test("strict decoders reject incomplete and malformed data", () => {
  for (const [id, input] of [
    ["hex", "f"],
    ["hex", "xyz0"],
    ["hex", "ff"],
    ["binary", "010101"],
    ["binary", "01002000"],
    ["utf8", "%GG"],
    ["utf8", "%ff"],
    ["utf16le", "abc"],
    ["base64", "%%%"],
    ["base32", "0000"],
    ["decimal", "-1"],
    ["decimal", "1114112"],
    ["decimal", "55296"],
  ]) {
    assert.throws(
      () => convert(input, id, "decode"),
      `${id} should reject ${input}`,
    );
  }
});

test("URL decode unwraps layers and preserves a final literal percent", () => {
  assert.equal(
    convert("Hello%252C%2520world%2521", "urlDecodeAll", "decode"),
    "Hello, world!",
  );
  assert.equal(convert("100%25", "urlDecodeAll", "decode"), "100%");
  assert.throws(() => convert("%GG", "url", "decode"));
  assert.throws(() => convert("%GG", "urlDecodeAll", "decode"));
});

test("HTML entities are decoded without parsing or stripping markup", () => {
  assert.equal(
    convert(
      "&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;",
      "htmlEntities",
      "decode",
    ),
    '<script>alert("hi")</script>',
  );
  assert.equal(
    convert("<b>hello</b> &copy;", "htmlEntities", "decode"),
    "<b>hello</b> \u00a9",
  );
});

test("JSON tools format, minify, and return validation output", () => {
  assert.equal(convert('{"a":1}', "jsonPretty", "encode"), '{\n  "a": 1\n}');
  assert.equal(
    convert('{ "a": [1, 2] }', "jsonMinify", "encode"),
    '{"a":[1,2]}',
  );
  assert.match(convert("null", "jsonValidate", "encode"), /^Valid JSON/);
  assert.throws(
    () => convert("{bad}", "jsonValidate", "encode"),
    /Invalid JSON/,
  );
  assert.throws(() => convert("", "jsonValidate", "encode"));
});

test("format detection identifies common encodings without claiming certainty", () => {
  for (const [input, expected] of [
    ["SGVsbG8sIHdvcmxkIQ==", "base64"],
    ["01001000 01101001", "binary"],
    ["48656c6c6f", "hex"],
    ["480065006c006c006f00", "utf16le"],
    ["00480065006c006c006f", "utf16be"],
    ["%48%69", "utf8"],
    ["Hello%20world", "url"],
    ["Hello%2520world", "urlDecodeAll"],
    ["&lt;hello&gt;", "htmlEntities"],
    ["72 105", "decimal"],
    ['{"a":1}', "jsonPretty"],
    ["<root><a>1</a></root>", "xmlPretty"],
  ]) {
    assert.equal(detectInput(input).toolId, expected, input);
  }
  assert.equal(detectInput("Hello, world!").toolId, null);
  assert.equal(
    detectInput("\u0645\u0631\u062d\u0628\u0627").label,
    "Arabic text",
  );
});

test("all examples are real, with no placeholders", () => {
  for (const tool of tools.filter((item) => item.category !== "formatters")) {
    const sample = exampleFor(tool, "decode");
    const result = convert(
      sample,
      tool.id,
      tool.category === "hashes" ? "encode" : "decode",
    );
    assert.ok(result.length > 0, tool.name);
    assert.doesNotMatch(result, /PLACEHOLDER|B58-/);
  }
  assert.equal(getTool("missing").id, "base64");
  assert.equal(characterCount("\ud83d\udc9c"), 1);
  assert.equal(byteCount("\ud83d\udc9c"), 4);
});
