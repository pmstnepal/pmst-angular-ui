#!/usr/bin/env node
/**
 * PMST Multi-Repository Commit Tool
 * 
 * Commits and pushes changes across all 4 PMST repositories
 * with contextual commit messages based on file types.
 * 
 * Usage: node tools/repo-commit.js [--dry-run]
 */

const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Repository configuration
const REPOS = [
  {
    name: 'pmst-angular-ui',
    path: 'd:\\pmstmigrate',
    defaultMessage: 'feat(frontend): update components'
  },
  {
    name: 'pmst-api-service',
    path: 'd:\\pmst-services\\pmst-api-service',
    defaultMessage: 'feat(api): update service'
  },
  {
    name: 'pmst-terraform-infra',
    path: 'd:\\pmstmigrateinfra',
    defaultMessage: 'infra: update terraform config'
  },
  {
    name: 'pmst-data-migration',
    path: 'd:\\pmst-migration',
    defaultMessage: 'migration: update scripts'
  }
];

// File type to commit message prefix mapping
const FILE_PATTERNS = [
  { pattern: /\.(component|service|module)\.ts$/, prefix: 'feat(frontend):', desc: 'Angular' },
  { pattern: /\.html$/, prefix: 'feat(frontend):', desc: 'Template' },
  { pattern: /\.java$/, prefix: 'feat(api):', desc: 'Java' },
  { pattern: /\.tf$/, prefix: 'infra:', desc: 'Terraform' },
  { pattern: /\.sql$/, prefix: 'migration:', desc: 'SQL' },
  { pattern: /\.scss$|\.css$/, prefix: 'style:', desc: 'Style' },
  { pattern: /\.md$/, prefix: 'docs:', desc: 'Docs' },
  { pattern: /Dockerfile|docker-compose/, prefix: 'docker:', desc: 'Docker' },
  { pattern: /\.yml$|\.yaml$/, prefix: 'ci:', desc: 'CI/CD' },
  { pattern: /\.json$/, prefix: 'chore:', desc: 'Config' }
];

/**
 * Execute git command in specified directory
 */
function gitCommand(repoPath, command) {
  try {
    return execSync(command, { 
      cwd: repoPath, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    if (error.stderr && !error.stderr.includes('nothing to commit')) {
      console.error(`Git error in ${repoPath}:`, error.stderr);
    }
    return null;
  }
}

/**
 * Get changed files in a repository
 */
function getChangedFiles(repoPath) {
  const output = gitCommand(repoPath, 'git status --porcelain');
  if (!output) return [];
  
  return output
    .split('\n')
    .filter(line => line.trim())
    .map(line => ({
      status: line.substring(0, 2).trim(),
      file: line.substring(3).trim()
    }));
}

/**
 * Generate commit message based on changed files
 */
function generateCommitMessage(files, defaultMessage) {
  if (files.length === 0) return null;
  
  // Find the most specific pattern match
  for (const { pattern, prefix, desc } of FILE_PATTERNS) {
    const matchingFiles = files.filter(f => pattern.test(f.file));
    if (matchingFiles.length > 0) {
      const action = files[0].status === '??' ? 'add' : 'update';
      return `${prefix} ${action} ${desc.toLowerCase()}`;
    }
  }
  
  return defaultMessage;
}

/**
 * Check if repository has changes
 */
function hasChanges(repoPath) {
  const files = getChangedFiles(repoPath);
  return files.length > 0;
}

/**
 * Commit and push changes
 */
function commitAndPush(repo, message, dryRun = false) {
  console.log(`\n📦 ${repo.name}`);
  console.log(`   Path: ${repo.path}`);
  console.log(`   Message: ${message}`);
  
  if (dryRun) {
    console.log('   [DRY RUN] Would commit and push');
    return true;
  }
  
  try {
    // Add all changes
    execSync('git add .', { cwd: repo.path, stdio: 'ignore' });
    
    // Commit
    execSync(`git commit -m "${message}"`, { cwd: repo.path, stdio: 'ignore' });
    
    // Push
    execSync('git push origin HEAD', { cwd: repo.path, stdio: 'ignore' });
    
    console.log('   ✅ Committed and pushed');
    return true;
  } catch (error) {
    console.log('   ⚠️  Nothing to commit or push failed');
    return false;
  }
}

/**
 * Prompt user for confirmation
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 PMST Multi-Repository Commit Tool\n');
  
  // Check each repository
  const reposWithChanges = [];
  
  for (const repo of REPOS) {
    const files = getChangedFiles(repo.path);
    
    if (files.length > 0) {
      const message = generateCommitMessage(files, repo.defaultMessage);
      reposWithChanges.push({ repo, files, message });
      
      console.log(`📁 ${repo.name}`);
      console.log(`   Changed files: ${files.length}`);
      files.slice(0, 5).forEach(f => console.log(`      ${f.status} ${f.file}`));
      if (files.length > 5) console.log(`      ... and ${files.length - 5} more`);
      console.log(`   Suggested: "${message}"\n`);
    } else {
      console.log(`✅ ${repo.name} - no changes\n`);
    }
  }
  
  if (reposWithChanges.length === 0) {
    console.log('🎉 All repositories are clean! Nothing to commit.');
    rl.close();
    return;
  }
  
  // Confirm with user
  const shouldProceed = await prompt(
    `Commit and push ${reposWithChanges.length} repositories? [y/N] `
  );
  
  if (!shouldProceed) {
    console.log('\n❌ Aborted. No changes committed.');
    rl.close();
    return;
  }
  
  // Execute commits
  console.log('\n🚀 Committing changes...\n');
  
  for (const { repo, message } of reposWithChanges) {
    await commitAndPush(repo, message, dryRun);
  }
  
  console.log('\n✨ Done!');
  rl.close();
}

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});

main();
