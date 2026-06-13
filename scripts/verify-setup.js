const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 VVU Platform Setup Verification\n');

try {
  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found. Please run from the vvu-platform directory.');
  }

  console.log('✅ Located package.json');

  // Check required files exist
  const requiredFiles = [
    'src/lib/watchdog/HeartbeatSchema.ts',
    'src/lib/watchdog/HeartbeatBus.ts',
    'src/lib/watchdog/WatchdogProbes.ts',
    'src/lib/watchdog/OrchestratorEngine.ts',
    'src/lib/watchdog/index.ts',
    'src/app/api/health/route.ts',
    'src/middleware.ts',
    'supabase/migrations/001_auth_rls.sql',
    'e2e/auth.spec.ts',
    'tsconfig.json',
    'next-env.d.ts',
    '.eslintrc.json',
    'jest.config.js',
    'README.md'
  ];

  const missingFiles = [];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.log('❌ Missing required files:');
    missingFiles.forEach(file => console.log(`  - ${file}`));
    process.exit(1);
  } else {
    console.log('✅ All required files present');
  }

  // Check TypeScript configuration
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript configuration is valid');
  } catch (error) {
    console.log('❌ TypeScript configuration error:');
    console.log(error.stdout.toString());
    process.exit(1);
  }

  // Check ESLint configuration (basic)
  try {
    execSync('npx eslint --print-config .eslintrc.json', { stdio: 'pipe' });
    console.log('✅ ESLint configuration is valid');
  } catch (error) {
    console.log('⚠️  ESLint configuration warning (may still work):');
    console.log(error.stdout.toString());
  }

  // Check package.json has required dependencies
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    '@supabase/auth-helpers-nextjs',
    '@supabase/supabase-js',
    'next',
    'react',
    'react-dom'
  ];

  const missingDeps = [];
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  }

  if (missingDeps.length > 0) {
    console.log('❌ Missing required dependencies:');
    missingDeps.forEach(dep => console.log(`  - ${dep}`));
    process.exit(1);
  } else {
    console.log('✅ All required dependencies present in package.json');
  }

  // Check that Gate B webhook path is in middleware
  const middlewarePath = path.join(process.cwd(), 'src/middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  if (!middlewareContent.includes('/api/webhooks')) {
    console.log('❌ Gate B webhook path not found in middleware PUBLIC_PATHS');
    process.exit(1);
  } else {
    console.log('✅ Gate B webhook path correctly included in middleware');
  }

  console.log('\n🎉 All verification checks passed!');
  console.log('\n📋 Next Steps:');
  console.log('  1. Install dependencies: npm install');
  console.log('  2. Start development server: npm run dev');
  console.log('  3. Run tests: npm test');
  console.log('  4. Apply database migrations: npx supabase db migrate');
  console.log('  5. Run E2E tests: npm run test:e2e (after playwright install)');

} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}