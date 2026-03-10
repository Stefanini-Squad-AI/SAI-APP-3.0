import * as fs from "fs";
import * as path from "path";

export interface GherkinStep {
  keyword: "Given" | "When" | "Then" | "And" | "But";
  text: string;
  line: number;
}

export interface GherkinScenario {
  name: string;
  steps: GherkinStep[];
  tags?: string[];
  examples?: Array<Record<string, string>>;
}

export interface GherkinFeature {
  name: string;
  description: string;
  background?: GherkinStep[];
  scenarios: GherkinScenario[];
  tags?: string[];
}

export class GherkinParser {
  static parseFeatureFile(filePath: string): GherkinFeature {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    
    let feature: Partial<GherkinFeature> = {
      scenarios: [],
      description: "",
    };
    let currentScenario: Partial<GherkinScenario> | null = null;
    let inBackground = false;
    let backgroundSteps: GherkinStep[] = [];
    let inExamples = false;
    let exampleHeaders: string[] = [];
    let examples: Array<Record<string, string>> = [];
    let inFeatureDescription = false;
    let featureStarted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Skip empty lines
      if (!line) {
        inFeatureDescription = false;
        continue;
      }

      // Skip comments
      if (line.startsWith("#")) continue;

      // Tags a nivel de Feature (solo antes de Feature:)
      if (!featureStarted && line.startsWith("@")) {
        const tags = line.split(/\s+/).filter(t => t.startsWith("@"));
        if (!feature.tags) feature.tags = [];
        feature.tags.push(...tags);
        continue;
      }

      // Feature
      if (line.startsWith("Feature:")) {
        featureStarted = true;
        feature.name = line.replace("Feature:", "").trim();
        inFeatureDescription = true;
        continue;
      }

      // Background
      if (line.startsWith("Background:")) {
        inBackground = true;
        inFeatureDescription = false;
        continue;
      }

      // Scenario
      if (line.startsWith("Scenario:") || line.startsWith("Scenario Outline:")) {
        if (currentScenario) {
          if (examples.length > 0) {
            currentScenario.examples = examples;
          }
          feature.scenarios!.push(currentScenario as GherkinScenario);
        }
        currentScenario = {
          name: line.replace(/Scenario( Outline)?:/, "").trim(),
          steps: [],
        };
        inBackground = false;
        inExamples = false;
        inFeatureDescription = false;
        exampleHeaders = [];
        examples = [];
        continue;
      }

      // Examples
      if (line.startsWith("Examples:")) {
        inExamples = true;
        examples = [];
        continue;
      }

      // Example headers
      if (inExamples && line.startsWith("|")) {
        const cells = line.split("|").map(c => c.trim()).filter(c => c);
        if (exampleHeaders.length === 0) {
          exampleHeaders = cells;
        } else {
          const example: Record<string, string> = {};
          cells.forEach((cell, index) => {
            if (index < exampleHeaders.length) {
              example[exampleHeaders[index]] = cell;
            }
          });
          if (Object.keys(example).length > 0) {
            examples.push(example);
          }
        }
        continue;
      }

      // Steps - Soporta español e inglés
      const stepMatch = line.match(/^(Given|When|Then|And|But|Dado|Cuando|Entonces|Y|Pero)\s+(.+)$/i);
      if (stepMatch) {
        const keyword = stepMatch[1] as GherkinStep["keyword"];
        const text = stepMatch[2].trim();
        const step: GherkinStep = { keyword, text, line: lineNumber };

        if (inBackground) {
          backgroundSteps.push(step);
        } else if (currentScenario) {
          currentScenario.steps!.push(step);
        }
        inFeatureDescription = false;
        continue;
      }

      // Description lines (non-step lines after Feature/Scenario)
      if (inFeatureDescription && !line.startsWith("Feature:")) {
        if (feature.description) {
          feature.description += "\n" + line;
        } else {
          feature.description = line;
        }
      }
    }

    // Add last scenario
    if (currentScenario) {
      if (examples.length > 0) {
        currentScenario.examples = examples;
      }
      feature.scenarios!.push(currentScenario as GherkinScenario);
    }

    if (backgroundSteps.length > 0) {
      feature.background = backgroundSteps;
    }

    return feature as GherkinFeature;
  }

  static replacePlaceholders(text: string, values: Record<string, string>): string {
    let result = text;
    Object.keys(values).forEach(key => {
      const regex = new RegExp(`<${key}>`, "g");
      result = result.replace(regex, values[key]);
    });
    return result;
  }
}
