import { execSync } from "child_process";

console.log("Starting database generation...");

try {
  console.log("Generating skills...");
  execSync("ts-node scripts/generate-initial-skills.ts", { stdio: "inherit" });

  console.log("Generating accessories...");
  execSync("ts-node scripts/generate-initial-accessories.ts", {
    stdio: "inherit",
  });

  console.log("Generating armor...");
  execSync("ts-node scripts/generate-initial-armor.ts", { stdio: "inherit" });

  console.log("Generating weapons...");
  execSync("ts-node scripts/generate-initial-weapons.ts", { stdio: "inherit" });

  console.log("Database generation completed successfully!");
} catch (error) {
  console.error("Error during database generation:", error);
  process.exit(1);
}
