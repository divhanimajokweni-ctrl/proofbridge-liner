#!/usr/bin/env node
/**
 * ================================================================
 * Kilo Code FIM Autocomplete — VVU Production Setup
 * Cross-platform Node.js script
 * ================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ─── Colors ────────────────────────────────────────────────────
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function error(msg) {
    console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function success(msg) {
    console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function info(msg) {
    console.log(`${colors.cyan}📦 ${msg}${colors.reset}`);
}

// ─── Get VS Code settings path ──────────────────────────────
function getSettingsPath() {
    const platform = os.platform();
    let basePath;

    if (platform === 'darwin') {
        basePath = path.join(os.homedir(), 'Library/Application Support/Code/User');
    } else if (platform === 'win32') {
        basePath = path.join(process.env.APPDATA, 'Code/User');
    } else {
        basePath = path.join(os.homedir(), '.config/Code/User');
    }

    return path.join(basePath, 'settings.json');
}

// ─── Merge settings ──────────────────────────────────────────
function mergeSettings(settingsPath, newSettings) {
    let current = {};

    if (fs.existsSync(settingsPath)) {
        try {
            const content = fs.readFileSync(settingsPath, 'utf8');
            current = JSON.parse(content);
        } catch (e) {
            // Settings file may be empty or malformed
            current = {};
        }
    }

    // Merge new settings
    const merged = { ...current, ...newSettings };

    // Write back
    fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2));
    return merged;
}

// ─── Main execution ──────────────────────────────────────────
async function main() {
    log('🐜 VVU · Kilo Code FIM Autocomplete Setup', 'cyan');
    log('==========================================', 'cyan');
    console.log();

    // ─── STEP 1: Check VS Code ──────────────────────────────
    info('Checking VS Code installation...');

    let codeCmd;
    try {
        codeCmd = execSync('which code || where code', { shell: true }).toString().trim().split('\n')[0];
    } catch (e) {
        error('VS Code not found in PATH.');
        console.log('   Please install VS Code and add "code" to your PATH.');
        process.exit(1);
    }

    success(`VS Code found at: ${codeCmd}`);
    console.log();

    // ─── STEP 2: Install Kilo Code ──────────────────────────
    info('Installing/Updating Kilo Code extension...');

    try {
        execSync('code --install-extension kilocode.kilo-code --force', { stdio: 'inherit' });
        success('Kilo Code extension ready');
    } catch (e) {
        error('Failed to install via CLI. Please install manually from the VS Code marketplace.');
        console.log('   Extension ID: kilocode.kilo-code');
    }
    console.log();

    // ─── STEP 3: Configure settings ──────────────────────────
    info('Configuring VS Code settings...');

    const settingsPath = getSettingsPath();
    const settingsDir = path.dirname(settingsPath);

    if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
    }

    const kiloSettings = {
        'kilo-code.autocomplete.model': 'mistralai/codestral-2508',
        'kilo-code.new.autocomplete.enableSmartInlineTaskKeybinding': true,
        'kilo-code.autocomplete.enableAutoTrigger': true,
        'kilo-code.autocomplete.statusBarEnabled': true,
        'kilo-code.autocomplete.maxTokens': 2048,
        'kilo-code.autocomplete.timeout': 3000,
        'kilo-code.autocomplete.enableCache': true,
        'files.associations': {
            '*.log': 'log',
            'gate1_output.json': 'json',
            'vvu_production_manifest.json': 'json'
        },
        'editor.formatOnSave': true
    };

    mergeSettings(settingsPath, kiloSettings);
    success(`Settings configured at: ${settingsPath}`);
    console.log();

    // ─── STEP 4: Disable competing extensions ──────────────
    info('Disabling competing extensions...');

    const conflicting = ['github.copilot', 'github.copilot-chat', 'ms-vscode.vscode-js-profile-flame'];

    try {
        const installed = execSync('code --list-extensions', { encoding: 'utf8' }).split('\n');

        for (const ext of conflicting) {
            if (installed.some((line) => line.includes(ext))) {
                info(`   Disabling: ${ext}`);
                try {
                    execSync(`code --disable-extension ${ext}`, { stdio: 'ignore' });
                } catch (e) {
                    // Extension may not be installed or already disabled
                }
            }
        }
        success('Competing extensions disabled');
    } catch (e) {
        error('Could not list extensions. Please disable manually.');
    }
    console.log();

    // ─── STEP 5: API Key Instructions ──────────────────────
    log('🔑 API Key Configuration', 'yellow');
    log('=======================', 'yellow');
    console.log();
    console.log('To set up your Mistral/Codestral API key:');
    console.log('');
    console.log('1. Visit: https://app.kilo.ai/byok');
    console.log('2. Add your Mistral API key to the BYOK provider slot');
    console.log('3. Key format: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('');

    // ─── STEP 6: Workspace config ──────────────────────────
    info('Creating VVU workspace configuration...');

    const workspaceSettingsPath = '.vscode/settings.json';
    const workspaceDir = path.dirname(workspaceSettingsPath);

    if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
    }

    fs.writeFileSync(workspaceSettingsPath, JSON.stringify(kiloSettings, null, 2));
    success(`Workspace settings created at ${workspaceSettingsPath}`);
    console.log();

    // ─── STEP 7: Completion ──────────────────────────────────
    log('✅ ================================================================', 'green');
    log('✅ Kilo Code FIM Autocomplete is ready for production!', 'green');
    log('✅ ================================================================', 'green');
    console.log('');
    console.log('🎯 Quick Reference:');
    console.log('   • Manual trigger: Cmd+L (Mac) / Ctrl+L (Linux/Windows)');
    console.log('   • Auto-trigger: Pause typing — ghost text appears');
    console.log('   • Status bar: Click to toggle autocomplete on/off');
    console.log('   • Context comments: Drop // VVU Rule: before triggering');
    console.log('');
    console.log('📖 Keybindings:');
    console.log('   • Accept suggestion: Tab');
    console.log('   • Cycle suggestions: Cmd+Shift+. / Cmd+Shift+,');
    console.log('   • Trigger manual: Cmd+L');
    console.log('');
    console.log('🔗 BYOK Setup: https://app.kilo.ai/byok');
    console.log('');
    log('🐜 VVU · Kilo Code FIM Setup Complete', 'cyan');
}

// ─── Run ──────────────────────────────────────────────────────
main().catch((err) => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
});
