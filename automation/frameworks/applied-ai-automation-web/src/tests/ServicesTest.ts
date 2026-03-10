import { AutomationClient } from "../configs/AutomationClient";
import { ReportGenerator } from "../hooks/ReportGenerator";
import { GherkinParser } from "../gherkin/GherkinParser";
import { GherkinExecutor } from "../gherkin/GherkinExecutor";
import { StagehandConfig } from "../configs/StagehandConfig";
import * as path from "path";
import * as fs from "fs";

/**
 * Test de la vista Services de Tu Crédito Online (TCO-19)
 *
 * Escenario: Cambio de idioma a inglés, navegación a Services y verificación
 * de que los títulos "Our Services" y "Not sure which one to choose?" se muestran.
 */
export class ServicesTest {
  async execute(): Promise<void> {
    const client = new AutomationClient();

    const tempVideoDir = path.join(process.cwd(), "reports", "temp-videos");
    if (!fs.existsSync(tempVideoDir)) {
      fs.mkdirSync(tempVideoDir, { recursive: true });
    }

    const stagehandConfig = StagehandConfig.getInstance();
    stagehandConfig.setVideoDirectory(tempVideoDir);

    await client.initialize();

    const reportGenerator = new ReportGenerator(client, "ServicesTest");

    const finalVideoDir = path.join(reportGenerator.getCurrentReportDir(), "videos");
    if (!fs.existsSync(finalVideoDir)) {
      fs.mkdirSync(finalVideoDir, { recursive: true });
    }
    reportGenerator.setVideoDirectory(finalVideoDir);

    try {
      const featurePath = path.join(__dirname, "../features/services.feature");
      const feature = GherkinParser.parseFeatureFile(featurePath);

      const executor = new GherkinExecutor(client, reportGenerator);
      await executor.executeFeature(feature);
    } catch (error: any) {
      console.error("\n❌ ERROR:", error.message);
      await reportGenerator.generateReport("FAILED");
      throw error;
    } finally {
      await client.close();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const finalVideoDirPath = path.join(reportGenerator.getCurrentReportDir(), "videos");
      const tempVideoDirPath = path.join(process.cwd(), "reports", "temp-videos");

      if (fs.existsSync(tempVideoDirPath)) {
        const tempVideos = fs
          .readdirSync(tempVideoDirPath)
          .filter((file) => file.endsWith(".webm") || file.endsWith(".mp4"))
          .sort((a, b) => {
            const statA = fs.statSync(path.join(tempVideoDirPath, a));
            const statB = fs.statSync(path.join(tempVideoDirPath, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
          });

        if (tempVideos.length > 0 && fs.existsSync(finalVideoDirPath)) {
          const sourceVideo = path.join(tempVideoDirPath, tempVideos[0]);
          const destVideo = path.join(finalVideoDirPath, `test-recording-${Date.now()}.webm`);
          try {
            let retries = 10;
            while (retries > 0) {
              try {
                const stats = fs.statSync(sourceVideo);
                if (stats.size > 1024) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  break;
                }
              } catch {
                // Archivo aún no está listo
              }
              await new Promise((resolve) => setTimeout(resolve, 300));
              retries--;
            }

            if (fs.existsSync(sourceVideo)) {
              fs.copyFileSync(sourceVideo, destVideo);
              fs.unlinkSync(sourceVideo);
              console.log(`✅ [VIDEO] Video movido al directorio del reporte: ${destVideo}`);
              reportGenerator.setVideoDirectory(finalVideoDirPath);
            }
          } catch (error: any) {
            console.warn(`⚠️  [VIDEO] No se pudo mover el video: ${error?.message || error}`);
          }
        }
      }
    }
  }
}
