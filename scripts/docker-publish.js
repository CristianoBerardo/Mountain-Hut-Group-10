const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file if present
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

// Read version from root package.json
const pkgPath = path.resolve(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

// Parse CLI arguments
const args = process.argv.slice(2);
const isBuildOnly = args.includes("--build-only");
const isDryRun = args.includes("--dry-run");
const explicitTag = args.find((arg) => !arg.startsWith("--"));

// Determine version tag (Priority: CLI argument > Env TAG > package.json)
const tag = explicitTag || process.env.TAG || pkg.version || "latest";

// Determine Docker Hub username / namespace
const dockerUser = (process.env.DOCKER_USER || "mountainhut").toLowerCase();

if (!process.env.DOCKER_USER) {
  console.log(
    "\x1b[33m%s\x1b[0m",
    `[INFO] DOCKER_USER not defined in .env or environment. Using '${dockerUser}'.`
  );
  console.log(
    "\x1b[33m%s\x1b[0m",
    "       You can set it in .env (e.g., DOCKER_USER=your_username) to publish to your account.\n"
  );
}

const backendImageBase = `${dockerUser}/mountain-hut-backend`;
const frontendImageBase = `${dockerUser}/mountain-hut-frontend`;

console.log("\x1b[36m%s\x1b[0m", "========================================");
console.log("\x1b[36m%s\x1b[0m", "       Docker Hub Build & Deploy        ");
console.log("\x1b[36m%s\x1b[0m", "========================================");
console.log(`- Docker Hub Namespace: \x1b[32m${dockerUser}\x1b[0m`);
console.log(`- Version / Tag:        \x1b[32m${tag}\x1b[0m`);
console.log(`- Backend Image:        \x1b[32m${backendImageBase}:${tag}\x1b[0m`);
console.log(`- Frontend Image:       \x1b[32m${frontendImageBase}:${tag}\x1b[0m`);
console.log(`- Mode:                 \x1b[32m${isDryRun ? "Simulation (Dry Run)" : isBuildOnly ? "Build Only" : "Build & Push"}\x1b[0m`);
console.log("----------------------------------------\n");

const env = {
  ...process.env,
  DOCKER_USER: dockerUser,
  TAG: tag,
};

function run(command, cmdArgs) {
  console.log(`\x1b[34m> ${command} ${cmdArgs.join(" ")}\x1b[0m`);
  if (isDryRun) {
    console.log(`  [DRY-RUN] Simulated command.`);
    return;
  }
  const result = spawnSync(command, cmdArgs, {
    stdio: "inherit",
    shell: true,
    env,
  });
  if (result.status !== 0) {
    console.error(
      `\x1b[31m[ERROR] Command '${command} ${cmdArgs.join(" ")}' exited with code ${result.status}\x1b[0m`
    );
    process.exit(result.status || 1);
  }
}

// 1. Build images using root compose.yaml
console.log(`\x1b[32m[1/3] Building images (tag: ${tag})...\x1b[0m`);
run("docker", ["compose", "-f", "compose.yaml", "build", "backend", "frontend"]);

// 2. Tag as 'latest' if current tag is different
if (tag !== "latest") {
  console.log("\x1b[32m[2/3] Creating secondary ':latest' tag...\x1b[0m");
  run("docker", ["tag", `${backendImageBase}:${tag}`, `${backendImageBase}:latest`]);
  run("docker", ["tag", `${frontendImageBase}:${tag}`, `${frontendImageBase}:latest`]);
} else {
  console.log("\x1b[32m[2/3] Tag ':latest' already set as primary version.\x1b[0m");
}

// 3. Push to Docker Hub (if not in build-only mode)
if (isBuildOnly) {
  console.log("\n\x1b[32m✓ Build completed successfully! (--build-only specified)\x1b[0m\n");
  process.exit(0);
}

console.log("\x1b[32m[3/3] Pushing images to Docker Hub...\x1b[0m");
console.log("\x1b[33m(Ensure you are authenticated with 'docker login' beforehand)\x1b[0m\n");

// Push specific tag
run("docker", ["push", `${backendImageBase}:${tag}`]);
run("docker", ["push", `${frontendImageBase}:${tag}`]);

// Push :latest tag if different
if (tag !== "latest") {
  run("docker", ["push", `${backendImageBase}:latest`]);
  run("docker", ["push", `${frontendImageBase}:latest`]);
}

console.log("\n\x1b[32m✓ Deploy to Docker Hub completed successfully!\x1b[0m\n");
