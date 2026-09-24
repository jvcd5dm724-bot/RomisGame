import { validateContent } from "../src/content/validate";

const issues = validateContent();

if (issues.length > 0) {
  console.error(`Found ${issues.length} content issue(s):\n`);
  for (const issue of issues) {
    console.error(`  [${issue.kind}] ${issue.id}: ${issue.problem}`);
  }
  process.exit(1);
}

console.log("Content OK: every item has its required Hebrew hints.");
