import { writeFileSync } from "node:fs";
import { fetchAllContributions } from "./fetch.js";
import { generateSVG } from "./svg.js";

const USERNAME = "djmetzle";
const OUTPUT_FILE = "contributions.svg";

console.log(`Fetching contributions for ${USERNAME}...`);
const contributions = fetchAllContributions(USERNAME);

console.log(`Generating SVG...`);
const svg = generateSVG(contributions);

writeFileSync(OUTPUT_FILE, svg);
console.log(`Written to ${OUTPUT_FILE}`);
