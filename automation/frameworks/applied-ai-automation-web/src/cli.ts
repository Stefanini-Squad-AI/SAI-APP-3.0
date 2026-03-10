#!/usr/bin/env node

import { TestRunner } from "./utils/TestRunner";

/**
 * CLI para ejecutar tests individuales, todos los tests, o por tag
 *
 * Uso:
 *   npm start                         -> Ejecuta todos los tests
 *   npm start HomeTest                -> Ejecuta solo HomeTest
 *   npm run test -- --tag @demo-sai3  -> Ejecuta todos los tests con tag @demo-sai3
 *   npm run test:tag @demo-sai3       -> Ejecuta tests con tag @demo-sai3
 *   npm run test:all                  -> Ejecuta todos los tests
 *   npm run test:list                 -> Lista tests disponibles
 */

async function main() {
  const runner = new TestRunner();
  const args = process.argv.slice(2);

  const tagIdx = args.indexOf("--tag");
  const tagIndex = tagIdx >= 0 ? tagIdx : args.indexOf("-t");
  if (tagIndex >= 0 && args[tagIndex + 1]) {
    const tag = args[tagIndex + 1];
    await runner.runTestsByTag(tag);
    return;
  }

  if (args.length === 0) {
    console.log("🚀 Ejecutando todos los tests...\n");
    await runner.runAllTests();
  } else if (args[0] === "--list" || args[0] === "-l") {
    const tests = runner.listTests();
    console.log("\n📋 Tests disponibles:");
    tests.forEach((test) => console.log(`  - ${test}`));
    const tagTests = runner.getTestsByTag("@demo-sai3");
    if (tagTests.length > 0) {
      console.log("\n📌 Tests con tag @demo-sai3:");
      tagTests.forEach((test) => console.log(`  - ${test}`));
    }
  } else if (args[0] === "--all" || args[0] === "all") {
    await runner.runAllTests();
  } else {
    const testName = args[0];
    await runner.runTest(testName);
  }
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});

