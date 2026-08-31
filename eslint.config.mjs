import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
    "react-hooks/set-state-in-effect": "off",
  },
}, {
  ignores: [
    "node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts",
    "examples/**", "skills", "searm1-app/**", "searm1-backend/**",
    "public/searm1/**", "download/searm1/**", "download/**", "tool-results/**",
    "air/**", "test/**", "tests/**", "upload/**", "vvu-immortal/**",
    "vvu-mcp-server/**", "ai-gateway/**", "pipeline/**", "_app_legacy/**",
    "disposable-storage/**", "scripts/**", "mini-services/**", "prover/**",
    "server/**", "packages/**", "lib/**",
    "src/lib/webhook/**", "src/gateway/**", "src/engine/**", "src/signer/**",
    "src/storage/**", "src/runtime/**", "src/logger.ts", "src/lib/theorem/**",
    "src/lib/studi/**", "src/lib/study/**", "src/lib/eis/*.js", "src/lib/db.js",
    "src/lib/utils.js", "src/hooks/use-toast.js", "src/hooks/use-mobile.js",
    "src/config.ts", "src/types.ts"
  ]
}];

export default eslintConfig;
