import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

Given('I navigate to the deployed pull request preview', async function (this: AuraWorld) {
  const previewUrl = process.env['AURA_TARGET_URL']?.trim() || 'http://localhost:3000';
  await this.webActions.navigateTo(previewUrl);
});
