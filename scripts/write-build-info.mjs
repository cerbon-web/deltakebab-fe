import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputFile = path.join(projectRoot, 'src', 'environments', 'build-info.ts');
const requestedBuildDate = process.env.BUILD_DATE || process.env.GITHUB_RUN_STARTED_AT;
const buildDate = requestedBuildDate || new Date().toISOString();

const content = `export const buildInfo = {
  buildDate: ${JSON.stringify(buildDate)}
};
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, content, 'utf8');
