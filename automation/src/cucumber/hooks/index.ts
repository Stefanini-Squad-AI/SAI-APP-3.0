/**
 * AURA — Global Cucumber Hooks
 * Lifecycle hooks that manage browser setup/teardown, step-level data
 * collection, screenshot capture, and AURA report generation.
 */
import { Before, After, BeforeStep, AfterStep, Status, setDefaultTimeout } from '@cucumber/cucumber';
import type { GherkinDocument, PickleStep } from '@cucumber/messages';
import type { AuraWorld } from '../world/AuraWorld';

setDefaultTimeout(120_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStepKeyword(pickleStep: PickleStep, doc: GherkinDocument): string {
  const astNodeId = pickleStep.astNodeIds[0];
  if (!astNodeId || !doc.feature) return 'Step';

  for (const child of doc.feature.children) {
    const section = child.scenario ?? child.background;
    if (!section?.steps) continue;
    const match = section.steps.find(s => s.id === astNodeId);
    if (match) return match.keyword.trim();
  }
  return 'Step';
}

type StepStatus = 'passed' | 'failed' | 'skipped' | 'pending';

function toCoreStatus(cucumberStatus: typeof Status[keyof typeof Status]): StepStatus {
  switch (cucumberStatus) {
    case Status.PASSED:    return 'passed';
    case Status.FAILED:    return 'failed';
    case Status.SKIPPED:   return 'skipped';
    case Status.PENDING:   return 'pending';
    case Status.UNDEFINED: return 'pending';
    default:               return 'skipped';
  }
}

// ─── Scenario Lifecycle ───────────────────────────────────────────────────────

Before(async function (this: AuraWorld, { pickle, gherkinDocument }) {
  const featureName = gherkinDocument.feature?.name ?? 'Unknown Feature';
  const tags = (pickle.tags ?? []).map(t => t.name ?? '');
  await this.init(pickle.name, featureName, tags);
});

After(async function (this: AuraWorld, { result }) {
  let videoPath: string | undefined;
  try {
    videoPath = await this.page?.video()?.path() ?? undefined;
  } catch { /* video recording not enabled */ }

  if (result?.status === Status.FAILED) {
    try {
      const buf = await this.page.screenshot({ fullPage: true });
      await this.attach(buf, 'image/png');
    } catch { /* non-critical */ }
  }

  await this.teardown();

  try {
    const htmlPath = await this.report.generateReport(videoPath);
    console.info(`[AURA/Report] ✓ Report → ${htmlPath}`);
  } catch (err) {
    console.error('[AURA/Report] Report generation failed:', err);
  }
});

// ─── Step Lifecycle ───────────────────────────────────────────────────────────

BeforeStep(function (this: AuraWorld, { pickleStep, gherkinDocument }) {
  const keyword = getStepKeyword(pickleStep, gherkinDocument);
  this.report.startStep(keyword, pickleStep.text);
});

AfterStep(async function (this: AuraWorld, { pickleStep, result, gherkinDocument }) {
  const keyword = getStepKeyword(pickleStep, gherkinDocument);
  const status = toCoreStatus(result.status);
  const error = result.message || undefined;

  // Inject detailed intent results (element, action, selector, duration) into report logs
  const intentResults = this.collectIntentResults();
  if (intentResults.length > 0) {
    this.report.addIntentResults(intentResults);

    if (result.status === Status.FAILED) {
      await this.attach(JSON.stringify(intentResults, null, 2), 'application/json');
    }
  }

  await this.report.endStep(keyword, pickleStep.text, status, this.page, error);
});
