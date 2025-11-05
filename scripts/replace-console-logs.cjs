#!/usr/bin/env node
/**
 * Script to replace console.* calls with structured logging
 * This helps automate the tedious process of replacing hundreds of console calls
 */

const fs = require('fs')
const path = require('path')

// Files to process (excluding scripts, tests, and docs)
const targetDirs = [
  'server/utils',
  'server/api',
  'server/tasks',
  'server/routes',
  'app/composables',
  'app/pages',
  'app/lib',
  'app'
]

// Skip these directories and files
const skipPatterns = [
  /node_modules/,
  /\.nuxt/,
  /\.output/,
  /dist/,
  /\.test\./,
  /\.spec\./,
  /replace-console-logs\.js/,
  /logger\.ts/
]

// Patterns to replace
const replacements = [
  {
    // console.log(...) -> logger.info(...)
    pattern: /console\.log\(/g,
    replacement: 'logger.info('
  },
  {
    // console.warn(...) -> logger.warn(...)
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn('
  },
  {
    // console.error(...) -> logger.error(...) - more complex, needs error object extraction
    pattern: /console\.error\(/g,
    replacement: 'logger.error('
  }
]

function shouldSkip(filePath) {
  return skipPatterns.some(pattern => pattern.test(filePath))
}

function addLoggerImport(content, filePath) {
  // Check if logger is already imported
  if (content.includes('from \'./logger\'') || content.includes('from "../utils/logger"')) {
    return content
  }

  // Determine import path based on file location
  let importPath
  if (filePath.includes('/server/utils/')) {
    importPath = './logger'
  } else if (filePath.includes('/server/')) {
    importPath = '../utils/logger'
  } else {
    // For app files, we can't use server utils, skip
    return content
  }

  // Find first import statement and add logger import after it
  const importMatch = content.match(/^import .+ from .+$/m)
  if (importMatch) {
    const importLine = importMatch[0]
    const importIndex = content.indexOf(importLine)
    const afterImport = importIndex + importLine.length

    return content.slice(0, afterImport)
      + `\nimport { logger } from '${importPath}'`
      + content.slice(afterImport)
  } else {
    // No imports found, add at top
    return `import { logger } from '${importPath}'\n\n${content}`
  }
}

function processFile(filePath) {
  if (shouldSkip(filePath)) {
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')

  // Check if file has console.* calls
  if (!/console\.(log|warn|error)/.test(content)) {
    return
  }

  // Only process server files
  if (!filePath.includes('/server/')) {
    console.log(`Skipping non-server file: ${filePath}`)
    return
  }

  console.log(`Processing: ${filePath}`)

  // Apply replacements
  let modified = false
  for (const { pattern, replacement } of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement)
      modified = true
    }
  }

  if (modified) {
    // Add logger import
    content = addLoggerImport(content, filePath)

    // Write back
    fs.writeFileSync(filePath, content)
    console.log(`  ✓ Updated ${filePath}`)
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (!shouldSkip(filePath)) {
        walkDir(filePath)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      processFile(filePath)
    }
  }
}

// Process target directories
const rootDir = process.cwd()
console.log('Starting console.* replacement...\n')

for (const dir of targetDirs) {
  const fullPath = path.join(rootDir, dir)
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath)
  }
}

console.log('\n✓ Done!')
