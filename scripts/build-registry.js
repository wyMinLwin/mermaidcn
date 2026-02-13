/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "public", "r")

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true })

// Read registry.json
const registry = JSON.parse(
  fs.readFileSync(path.join(ROOT, "registry.json"), "utf-8")
)

function readFileContent(filePath) {
  const fullPath = path.join(ROOT, filePath)
  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: File not found: ${fullPath}`)
    process.exit(1)
  }
  return fs.readFileSync(fullPath, "utf-8")
}

// Build each item
for (const item of registry.items) {
  const output = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies || [],
    devDependencies: item.devDependencies || [],
    registryDependencies: item.registryDependencies || [],
    files: item.files.map((file) => ({
      path: file.target,
      type: file.type,
      content: readFileContent(file.path),
      target: file.target,
    })),
  }

  const outPath = path.join(OUT_DIR, `${item.name}.json`)
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`Built: public/r/${item.name}.json`)
}

// Build the style index
const stylesDir = path.join(OUT_DIR, "styles", "new-york")
fs.mkdirSync(stylesDir, { recursive: true })

const indexItems = registry.items.map((item) => ({
  name: item.name,
  type: item.type,
  title: item.title,
  description: item.description,
  dependencies: item.dependencies || [],
  registryDependencies: item.registryDependencies || [],
}))

fs.writeFileSync(
  path.join(stylesDir, "index.json"),
  JSON.stringify(indexItems, null, 2)
)
console.log("Built: public/r/styles/new-york/index.json")

console.log(`\nRegistry build complete! ${registry.items.length} items built.`)
