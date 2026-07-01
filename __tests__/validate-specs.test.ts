import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('SOC2 Compliance Script Boundary Validation Suite', () => {
  const sandboxPath = path.join(process.cwd(), 'app/docs/architecture');
  const scriptPath = path.join(process.cwd(), 'scripts/validate-specs.sh');

  beforeAll(() => {
    fs.mkdirSync(sandboxPath, { recursive: true });
  });

  afterEach(() => {
    const files = fs.readdirSync(sandboxPath);
    for (const file of files) {
      fs.unlinkSync(path.join(sandboxPath, file));
    }
  });

  afterAll(() => {
    fs.rmSync(path.join(process.cwd(), 'app/docs'), { recursive: true, force: true });
  });

  test('Build Gate drops execution if security classification tags are missing', () => {
    const doc = '---\ntype: system-specification\ncompliance_target: SOC2-SEC-CC.6.1\n---\n# SafeLiner Edge Gateway configuration parameter.';
    fs.writeFileSync(path.join(sandboxPath, 'test-missing-tags.md'), doc);
    expect(() => execSync(`bash ${scriptPath}`, { stdio: 'pipe' })).toThrow();
  });

  test('Build Gate drops execution if compliance_target is outside boundary bounds', () => {
    const doc = '---\ntype: system-specification\nclassification: RESTRICTED-INTERNAL\ncompliance_target: SOC2-SEC-CC.9.9\n---\n# SafeKrypte HSM Enclave configuration parameter.';
    fs.writeFileSync(path.join(sandboxPath, 'test-bad-control.md'), doc);
    expect(() => execSync(`bash ${scriptPath}`, { stdio: 'pipe' })).toThrow();
  });

  test('Build Gate drops execution if file scope does not reference SafeKrypte or SafeLiner', () => {
    const doc = '---\ntype: system-specification\nclassification: RESTRICTED-INTERNAL\ncompliance_target: SOC2-SEC-CC.6.1\n---\n# An unrelated platform component file.';
    fs.writeFileSync(path.join(sandboxPath, 'test-out-of-scope.md'), doc);
    expect(() => execSync(`bash ${scriptPath}`, { stdio: 'pipe' })).toThrow();
  });

  test('Build Gate returns exit 0 when all metadata parameters conform', () => {
    const doc = '---\ntype: system-specification\nclassification: RESTRICTED-INTERNAL\ncompliance_target: SOC2-SEC-CC.6.3\n---\n# SafeKrypte HSM Engine Configuration parameters list block. This file handles core cryptographic parameter bindings.';
    fs.writeFileSync(path.join(sandboxPath, 'compliant-doc.md'), doc);
    const result = execSync(`bash ${scriptPath}`, { encoding: 'utf8' });
    expect(result).toContain('Security clearance: All docs validated.');
  });
});
