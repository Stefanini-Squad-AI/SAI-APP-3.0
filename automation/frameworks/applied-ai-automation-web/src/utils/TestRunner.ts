import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { GherkinParser } from "../gherkin/GherkinParser";

/**
 * Ejecutor de tests que permite ejecutar un test específico, todos los tests,
 * o solo los que tienen un tag específico (ej: @demo-sai3) en su archivo .feature
 */
export class TestRunner {
  private testsDir: string;
  private featuresDir: string;

  constructor() {
    const projectRoot = process.cwd();
    this.testsDir = path.join(projectRoot, "src", "tests");
    this.featuresDir = path.join(projectRoot, "src", "features");

    if (!fs.existsSync(this.testsDir)) {
      const compiledTestsDir = path.join(projectRoot, "dist", "tests");
      if (fs.existsSync(compiledTestsDir)) {
        this.testsDir = compiledTestsDir;
      }
    }
    if (!fs.existsSync(this.featuresDir)) {
      this.featuresDir = path.join(projectRoot, "dist", "features");
    }
  }

  /**
   * Convierte nombre de feature (ej: home.feature, language-pt.feature) al nombre de la clase Test
   * home.feature -> HomeTest, language-pt.feature -> LanguagePtTest
   */
  private featureFileNameToTestName(featureFileName: string): string {
    const baseName = featureFileName.replace(/\.feature$/, "");
    const parts = baseName.split(/[-_]/);
    const pascalCase = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("");
    return `${pascalCase}Test`;
  }

  /**
   * Obtiene los nombres de los tests cuyos archivos .feature tienen el tag indicado
   */
  getTestsByTag(tag: string): string[] {
    const normalizedTag = tag.startsWith("@") ? tag : `@${tag}`;
    const testNames: string[] = [];
    const seen = new Set<string>();

    if (!fs.existsSync(this.featuresDir)) {
      return [];
    }

    const featureFiles = fs.readdirSync(this.featuresDir).filter((f) => f.endsWith(".feature"));

    for (const featureFile of featureFiles) {
      const featurePath = path.join(this.featuresDir, featureFile);
      try {
        const feature = GherkinParser.parseFeatureFile(featurePath);
        const tags = feature.tags || [];
        if (tags.includes(normalizedTag)) {
          const testName = this.featureFileNameToTestName(featureFile);
          if (!seen.has(testName)) {
            seen.add(testName);
            testNames.push(testName);
          }
        }
      } catch {
        // Ignorar features que no se puedan parsear
      }
    }

    return testNames.sort();
  }

  /**
   * Lista todos los tests disponibles
   */
  listTests(): string[] {
    if (!fs.existsSync(this.testsDir)) {
      return [];
    }

    return fs.readdirSync(this.testsDir)
      .filter((file) => file.endsWith("Test.ts") || file.endsWith("Test.js"))
      .map((file) => file.replace(/\.(ts|js)$/, ""));
  }

  /**
   * Ejecuta un test específico
   */
  async runTest(testName: string): Promise<void> {
    const testPath = path.join(this.testsDir, `${testName}.ts`);
    
    if (!fs.existsSync(testPath)) {
      throw new Error(`Test "${testName}" no encontrado en ${this.testsDir}`);
    }

    console.log(`\n🧪 Ejecutando test: ${testName}\n`);
    
    try {
      const resolvedPath = path.resolve(testPath);
      const testFileUrl = pathToFileURL(resolvedPath).href;
      
      const testModule = await import(testFileUrl);
      const TestClass = testModule[testName];
      
      if (!TestClass) {
        throw new Error(`Clase "${testName}" no encontrada en el archivo`);
      }

      const testInstance = new TestClass();
      if (typeof testInstance.execute !== "function") {
        throw new Error(`El test "${testName}" no tiene un método execute()`);
      }

      await testInstance.execute();
    } catch (error: any) {
      console.error(`\n❌ Error ejecutando test "${testName}":`, error.message);
      throw error;
    }
  }

  /**
   * Ejecuta solo los tests cuyos archivos .feature tienen el tag indicado (ej: @demo-sai3)
   */
  async runTestsByTag(tag: string): Promise<void> {
    const testNames = this.getTestsByTag(tag);

    if (testNames.length === 0) {
      console.log(`\n⚠️ No se encontraron tests con tag "${tag}"`);
      return;
    }

    console.log(`\n🚀 Ejecutando ${testNames.length} test(s) con tag ${tag}...\n`);

    const results: Array<{ test: string; status: "PASSED" | "FAILED" }> = [];

    for (const testName of testNames) {
      const testPath = path.join(this.testsDir, `${testName}.ts`);
      if (!fs.existsSync(testPath)) {
        console.warn(`⚠️ Test "${testName}" referenciado por feature con tag ${tag} no existe en ${this.testsDir}`);
        continue;
      }
      try {
        await this.runTest(testName);
        results.push({ test: testName, status: "PASSED" });
      } catch {
        results.push({ test: testName, status: "FAILED" });
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📊 RESUMEN - Tests con tag ${tag}`);
    console.log("=".repeat(60));
    results.forEach((result) => {
      const icon = result.status === "PASSED" ? "✅" : "❌";
      console.log(`${icon} ${result.test}: ${result.status}`);
    });
    console.log("=".repeat(60));

    const failedCount = results.filter((r) => r.status === "FAILED").length;
    if (failedCount > 0) {
      throw new Error(`${failedCount} test(s) fallaron`);
    }
  }

  /**
   * Ejecuta todos los tests disponibles
   */
  async runAllTests(): Promise<void> {
    const tests = this.listTests();
    
    if (tests.length === 0) {
      console.log("No se encontraron tests para ejecutar");
      return;
    }

    console.log(`\n🚀 Ejecutando ${tests.length} test(s)...\n`);

    const results: Array<{ test: string; status: "PASSED" | "FAILED" }> = [];

    for (const test of tests) {
      try {
        await this.runTest(test);
        results.push({ test, status: "PASSED" });
      } catch (error) {
        results.push({ test, status: "FAILED" });
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DE EJECUCIÓN");
    console.log("=".repeat(60));
    results.forEach((result) => {
      const icon = result.status === "PASSED" ? "✅" : "❌";
      console.log(`${icon} ${result.test}: ${result.status}`);
    });
    console.log("=".repeat(60));
  }
}

