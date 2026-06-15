import path from "node:path";

const userAgent = process.env.npm_config_user_agent || "";
const execPath = process.env.npm_execpath || "";
const normalizedExecPath = execPath.replaceAll("\\", "/");
const execBasename = path.basename(normalizedExecPath);

const isPnpmUserAgent = /\bpnpm\//.test(userAgent);
const isPnpmExecPath =
  execBasename === "pnpm" ||
  execBasename === "pnpm.cjs" ||
  execBasename === "pnpm.js" ||
  normalizedExecPath.includes("/pnpm/");
const hasPnpmHome = Boolean(process.env.PNPM_HOME);

const isOtherPackageManager =
  /^(npm|yarn)\//.test(userAgent) ||
  ["npm", "npm-cli.js", "yarn", "yarn.js", "yarnpkg", "yarnpkg.js"].includes(execBasename);

if ((isPnpmUserAgent || isPnpmExecPath || hasPnpmHome) && !isOtherPackageManager) {
  process.exit(0);
}

console.error("Use pnpm install, not npm install.");
process.exit(1);
