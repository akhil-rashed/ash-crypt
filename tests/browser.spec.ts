import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("every tool is connected to a working UI operation, without runtime errors", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const samples: { id: string; name: string; example: string; category: string }[] = await page.evaluate(async () => {
    const moduleUrl = "/src/lib/conversions.ts";
    const { tools } = await import(/* @vite-ignore */ moduleUrl);
    return tools;
  });
  for (const tool of samples) {
    await page.keyboard.press("Control+k");
    await page.getByRole("textbox", { name: "Search all tools", exact: true }).fill(tool.name);
    await page.getByRole("textbox", { name: "Search all tools", exact: true }).press("Enter");
    await page.getByRole("textbox", { name: "Input text", exact: true }).fill(tool.example);
    if (["encodings", "network"].includes(tool.category) && tool.id !== "urlDecodeAll") {
      await page.getByRole("button", { name: "Encode", exact: true }).click();
    }
    await page.locator(".transformer-actions .primary-button").click();
    await expect(page.getByRole("textbox", { name: "Output text", exact: true })).not.toHaveValue("");
    await expect(page.locator("#conversion-error")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("malformed saved preferences and history do not break the workspace", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ashcrypt-theme", '"not-a-theme"');
    localStorage.setItem("ashcrypt-favorites", "null");
    localStorage.setItem("ashcrypt-auto-detect", '"not-a-boolean"');
    sessionStorage.setItem("ashcrypt-history", '[{"id":"bad","toolId":"base64","action":"encode","input":"a","output":"YQ==","time":1e400}]');
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".pinned-item")).toHaveCount(3);
  await page.getByRole("button", { name: "Recent activity", exact: false }).click();
  await expect(page.getByText("A lovely, clean slate.", { exact: true })).toBeVisible();
});

test("a Unicode conversion can be reversed, copied, and downloaded", async ({
  page,
  context,
}) => {
  const text = "Hello, caf\u00e9! \u0645\u0631\u062d\u0628\u0627 \ud83d\udc9c";
  const encoded = Buffer.from(text).toString("base64");
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill(text);
  await page.getByRole("button", { name: "Encode text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(encoded);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(encoded);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download output", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("ashcrypt-base64.txt");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toBe(encoded);
  await page
    .getByRole("button", { name: "Swap input and output", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Input text", exact: true }),
  ).toHaveValue(encoded);
  await page.getByRole("button", { name: "Decode text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(text);
});

test("empty input and invalid formats have useful, recoverable errors", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Encode text", exact: true }).click();
  await expect(page.locator("#conversion-error")).toContainText(
    "A little text first",
  );
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("Hello");
  await expect(page.locator("#conversion-error")).toHaveCount(0);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("%%%bad");
  await page.getByRole("button", { name: "Decode text", exact: true }).click();
  await expect(page.locator("#conversion-error")).toBeVisible();
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Input text", exact: true }),
  ).toHaveValue("");
  await expect(page.locator("#conversion-error")).toHaveCount(0);
});

test("smart detection chooses a decoder and manual choice wins", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("01001000 01101001");
  await expect(
    page.getByRole("button", { name: "Select format: Binary", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Decode text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue("Hi");
  await page
    .getByRole("button", { name: "Select format: Binary", exact: true })
    .click();
  await page.getByRole("option", { name: "Hexadecimal", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Select format: Hexadecimal",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("48656c6c6f");
  await page.getByRole("button", { name: "Decode text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue("Hello");
});

test("real hash generation includes MD5, SHA-1, and empty values", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Hash generator", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("abc");
  for (const [label, id] of [
    ["SHA-256", "sha256"],
    ["MD5", "md5"],
    ["SHA-1", "sha1"],
    ["SHA-512", "sha512"],
  ]) {
    await page.locator(".tool-picker-trigger").click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await page
      .getByRole("button", { name: "Generate hash", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Output text", exact: true }),
    ).toHaveValue(createHash(id).update("abc").digest("hex"));
  }
  await page.getByRole("textbox", { name: "Input text", exact: true }).fill("");
  await page
    .getByRole("button", { name: "Generate hash", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(createHash("sha512").update("").digest("hex"));
  await expect(
    page.getByRole("button", { name: "Swap input and output", exact: true }),
  ).toBeDisabled();
});

test("JSON and XML format, validate, and minify without damaging mixed content", async ({
  page,
}) => {
  await page.getByRole("button", { name: "JSON & XML", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill('{"a":[1,2],"label":"hello"}');
  await page.getByRole("button", { name: "Format text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(JSON.stringify({ a: [1, 2], label: "hello" }, null, 2));
  await page.getByRole("button", { name: "Minify", exact: true }).click();
  await page.getByRole("button", { name: "Minify text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue('{"a":[1,2],"label":"hello"}');
  await page.getByRole("button", { name: "Validate", exact: true }).click();
  await page
    .getByRole("button", { name: "Validate text", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(/^Valid JSON/);
  const xml =
    '<root>\n <p>one <b>two</b> three</p>\n <code xml:space="preserve">  x  \n y  </code>\n</root>';
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill(xml);
  await expect(
    page.getByRole("button", {
      name: "Select format: XML validator",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Validate text", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(/^Valid XML/);
  await page.getByRole("button", { name: "Minify", exact: true }).click();
  await page.getByRole("button", { name: "Minify text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(
    '<root><p>one <b>two</b> three</p><code xml:space="preserve">  x  \n y  </code></root>',
  );
  await page.getByRole("button", { name: "Format", exact: true }).click();
  await page.getByRole("button", { name: "Format text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(/\n  <p>one <b>two<\/b> three<\/p>/);
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("<a><b></a>");
  await page.getByRole("button", { name: "Format text", exact: true }).click();
  await expect(page.locator("#conversion-error")).toContainText("Invalid XML");
});

test("live mode stays out of history, manual results can be restored and cleared", async ({
  page,
}) => {
  await page
    .getByRole("switch", { name: "Live conversion", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("Hello");
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue("SGVsbG8=");
  await expect(page.locator(".history-count")).toHaveCount(0);
  await page.getByRole("button", { name: "Encode text", exact: true }).click();
  await expect(page.locator(".history-count")).toHaveText("1");
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await page
    .getByRole("button", { name: "Recent activity", exact: false })
    .click();
  await page.locator(".restore-history").first().click();
  await expect(
    page.getByRole("textbox", { name: "Input text", exact: true }),
  ).toHaveValue("Hello");
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue("SGVsbG8=");
  await page.reload();
  await page
    .getByRole("button", { name: "Recent activity", exact: false })
    .click();
  await expect(page.locator(".history-entry")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await expect(
    page.getByText("A lovely, clean slate.", { exact: true }),
  ).toBeVisible();
});

test("search, pinned tools, keyboard shortcuts, and real Base58 all work", async ({
  page,
}) => {
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("textbox", { name: "Search all tools", exact: true }),
  ).toBeFocused();
  await page.keyboard.type("base58");
  await page.getByRole("button", { name: "Pin Base58", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search all tools", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("button", { name: "Select format: Base58", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("Hello World");
  await page.keyboard.press("Control+Enter");
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue("JxF12TrwUP45BMd");
  await page
    .getByRole("button", { name: "Manage pinned tools", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Unpin Base58", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("local file import, expanded editors, themes, and settings are functional", async ({
  page,
}) => {
  await page
    .getByLabel("Import text file", { exact: true })
    .setInputFiles({
      name: "hello.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Local file, local thoughts."),
    });
  await expect(
    page.getByRole("textbox", { name: "Input text", exact: true }),
  ).toHaveValue("Local file, local thoughts.");
  await page
    .getByRole("button", { name: "Expand input editor", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Expanded input text", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("textbox", { name: "Expanded input text", exact: true })
    .fill("Room to think");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Encode text", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(Buffer.from("Room to think").toString("base64"));
  await page
    .getByRole("button", { name: "Dark appearance", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Workspace settings", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Save session history", exact: true })
    .click();
  await page.getByRole("button", { name: "Just right", exact: true }).click();
  await expect(page.locator(".history-count")).toHaveCount(0);
  expect(
    await page.evaluate(() => sessionStorage.getItem("ashcrypt-history")),
  ).toBeNull();
});

test("XML edge cases retain namespaces, comments, CDATA, and significant spaces", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const moduleUrl = "/src/lib/conversions.ts";
    const { convert } = await import(/* @vite-ignore */ moduleUrl);
    const inputs = [
      '<r xmlns:p="urn:test"><p:a x="a  b"> x </p:a><!-- c --><![CDATA[<raw>  x]]></r>',
      '<?xml version="1.0"?><root><nested><leaf/></nested></root>',
      '<root xml:space="preserve">  <a/> \n <b/>  </root>',
    ];
    return inputs.map((input) => {
      const output = convert(input, "xmlMinify", "encode");
      const doc = new DOMParser().parseFromString(output, "application/xml");
      return {
        output,
        valid: doc.getElementsByTagName("parsererror").length === 0,
        text: doc.documentElement.textContent,
      };
    });
  });
  expect(result.every((item) => item.valid)).toBeTruthy();
  expect(result[0].output).toContain("<![CDATA[<raw>  x]]>");
  expect(result[0].output).toContain('x="a  b"');
  expect(result[2].output).toBe(
    '<root xml:space="preserve">  <a/> \n <b/>  </root>',
  );
});

test("mobile navigation and all viewport sizes stay within the screen", async ({
  page,
}) => {
  for (const width of [360, 390, 700, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(380);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hash generator", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select format: SHA-256", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("abc");
  await page
    .getByRole("button", { name: "Generate hash", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Output text", exact: true }),
  ).toHaveValue(createHash("sha256").update("abc").digest("hex"));
});
