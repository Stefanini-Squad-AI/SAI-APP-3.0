import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

Given('I navigate to the deployed pull request preview', async function (this: AuraWorld) {
  const previewUrl = process.env['AURA_TARGET_URL'];

  if (!previewUrl) {
    throw new Error('AURA_TARGET_URL is not defined. Configure the preview URL before running tests.');
  }

  await this.webActions.navigateTo(previewUrl);
});
