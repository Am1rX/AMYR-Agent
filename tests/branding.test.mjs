import { test } from "node:test";
import assert from "node:assert/strict";
import { createAppTemplate, appGenerationPrompt } from "../src/application/templates.ts";
import { safeProjectPath, validateSpec } from "../src/application/protocol.ts";
import { NOVA_CODEGEN_NAME } from "../src/codegen.ts";

test("new native projects use Hermes names while existing Nova projects remain editable", () => {
  const fresh = createAppTemplate("12345678-aaaa-bbbb-cccc-dddddddddddd", "Example", "fa");
  validateSpec(fresh);
  assert.match(fresh.name, /^hermes_/);
  assert.ok(fresh.files.some(file => file.path === "lib/hermes/local_store.dart"));
  assert.match(appGenerationPrompt(fresh, "Example", "android-apk"), /HermesApp/);
  assert.throws(() => safeProjectPath("lib/hermes/local_store.dart"), /PROTECTED_TEMPLATE_FILE/);

  const legacyName = fresh.name.replace(/^hermes_/, "nova_");
  const legacy = {
    ...fresh,
    name: legacyName,
    files: fresh.files.map(file => ({ ...file, content: file.content.replaceAll(fresh.name, legacyName) })),
  };
  validateSpec(legacy);
  assert.match(appGenerationPrompt(legacy, "Example", "android-apk"), /NovaApp/);
  assert.throws(() => safeProjectPath("lib/nova/local_store.dart"), /PROTECTED_TEMPLATE_FILE/);
});

test("the code generation engine has the public Hermes name", () => {
  assert.equal(NOVA_CODEGEN_NAME, "Hermes Codegen");
});
