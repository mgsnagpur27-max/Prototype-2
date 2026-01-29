import type { FileSystemTree } from "@webcontainer/api";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: FileSystemTree;
}

const nextjsAppRouter: FileSystemTree = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "nextjs-app",
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
          },
          dependencies: {
            next: "14.2.5",
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            "@types/node": "^22.0.0",
            "@types/react": "^18.3.3",
            "@types/react-dom": "^18.3.0",
            typescript: "^5.5.4",
            tailwindcss: "^3.4.10",
            postcss: "^8.4.41",
            autoprefixer: "^10.4.20",
          },
        },
        null,
        2
      ),
    },
  },
  "next.config.mjs": {
    file: {
      contents: `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`,
    },
  },
  "tsconfig.json": {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./src/*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
    },
  },
  "tailwind.config.ts": {
    file: {
      contents: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
`,
    },
  },
  "postcss.config.mjs": {
    file: {
      contents: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`,
    },
  },
  src: {
    directory: {
      app: {
        directory: {
          "layout.tsx": {
            file: {
              contents: `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "Created with AI Code Editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`,
            },
          },
          "page.tsx": {
            file: {
              contents: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Welcome to Next.js
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Start editing <code className="bg-slate-700 px-2 py-1 rounded">src/app/page.tsx</code>
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Documentation
          </a>
          <a
            href="https://nextjs.org/learn"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
          >
            Learn Next.js
          </a>
        </div>
      </div>
    </main>
  );
}
`,
            },
          },
          "globals.css": {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
            },
          },
        },
      },
    },
  },
  "README.md": {
    file: {
      contents: `# Next.js App

This is a [Next.js](https://nextjs.org/) project bootstrapped with the AI Code Editor.

## Getting Started

Run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
`,
    },
  },
};

const reactViteSpa: FileSystemTree = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "react-vite-app",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc && vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            "@types/react": "^18.3.3",
            "@types/react-dom": "^18.3.0",
            "@vitejs/plugin-react": "^4.3.1",
            typescript: "^5.5.4",
            vite: "^5.4.0",
          },
        },
        null,
        2
      ),
    },
  },
  "vite.config.ts": {
    file: {
      contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
    },
  },
  "tsconfig.json": {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
          },
          include: ["src"],
          references: [{ path: "./tsconfig.node.json" }],
        },
        null,
        2
      ),
    },
  },
  "tsconfig.node.json": {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            composite: true,
            skipLibCheck: true,
            module: "ESNext",
            moduleResolution: "bundler",
            allowSyntheticDefaultImports: true,
          },
          include: ["vite.config.ts"],
        },
        null,
        2
      ),
    },
  },
  "index.html": {
    file: {
      contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
  },
  src: {
    directory: {
      "main.tsx": {
        file: {
          contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
        },
      },
      "App.tsx": {
        file: {
          contents: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App
`,
        },
      },
      "index.css": {
        file: {
          contents: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

.card {
  padding: 2em;
}
`,
        },
      },
    },
  },
};

const nodeExpressApi: FileSystemTree = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "express-api",
          version: "1.0.0",
          main: "dist/index.js",
          scripts: {
            dev: "tsx watch src/index.ts",
            build: "tsc",
            start: "node dist/index.js",
          },
          dependencies: {
            express: "^4.19.2",
            cors: "^2.8.5",
          },
          devDependencies: {
            "@types/express": "^4.17.21",
            "@types/cors": "^2.8.17",
            "@types/node": "^22.0.0",
            typescript: "^5.5.4",
            tsx: "^4.16.5",
          },
        },
        null,
        2
      ),
    },
  },
  "tsconfig.json": {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            outDir: "./dist",
            rootDir: "./src",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ["src/**/*"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
    },
  },
  src: {
    directory: {
      "index.ts": {
        file: {
          contents: `import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ]);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: Date.now(), name, email });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});
`,
        },
      },
    },
  },
  "README.md": {
    file: {
      contents: `# Express API

A simple Express.js API server with TypeScript.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /api/health\` - Health check
- \`GET /api/users\` - List users
- \`POST /api/users\` - Create user
`,
    },
  },
};

const typescriptLibrary: FileSystemTree = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "my-library",
          version: "1.0.0",
          main: "dist/index.js",
          types: "dist/index.d.ts",
          scripts: {
            dev: "tsx watch src/index.ts",
            build: "tsc",
            test: "tsx src/test.ts",
          },
          devDependencies: {
            "@types/node": "^22.0.0",
            typescript: "^5.5.4",
            tsx: "^4.16.5",
          },
        },
        null,
        2
      ),
    },
  },
  "tsconfig.json": {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            declaration: true,
            outDir: "./dist",
            rootDir: "./src",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
          },
          include: ["src/**/*"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
    },
  },
  src: {
    directory: {
      "index.ts": {
        file: {
          contents: `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

export function add(a: number, b: number): number {
  return a + b;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export class Calculator {
  private value: number = 0;

  add(n: number): this {
    this.value += n;
    return this;
  }

  subtract(n: number): this {
    this.value -= n;
    return this;
  }

  multiply(n: number): this {
    this.value *= n;
    return this;
  }

  divide(n: number): this {
    if (n === 0) throw new Error('Cannot divide by zero');
    this.value /= n;
    return this;
  }

  getResult(): number {
    return this.value;
  }

  reset(): this {
    this.value = 0;
    return this;
  }
}
`,
        },
      },
      "test.ts": {
        file: {
          contents: `import { greet, add, capitalize, Calculator } from './index';

console.log('Running tests...\\n');

console.log('greet("World"):', greet('World'));
console.log('add(2, 3):', add(2, 3));
console.log('capitalize("hello"):', capitalize('hello'));

const calc = new Calculator();
const result = calc.add(10).multiply(2).subtract(5).getResult();
console.log('Calculator chain result:', result);

console.log('\\nAll tests passed!');
`,
        },
      },
    },
  },
  "README.md": {
    file: {
      contents: `# TypeScript Library

A starter template for TypeScript libraries.

## Usage

\`\`\`typescript
import { greet, Calculator } from './src';

console.log(greet('World'));

const calc = new Calculator();
const result = calc.add(10).multiply(2).getResult();
\`\`\`

## Development

\`\`\`bash
npm install
npm run dev
npm run test
\`\`\`
`,
    },
  },
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "nextjs-app",
    name: "Next.js 14 App Router",
    description: "Modern Next.js app with App Router, TypeScript, and Tailwind CSS",
    icon: "nextjs",
    files: nextjsAppRouter,
  },
  {
    id: "react-vite",
    name: "React + Vite SPA",
    description: "Fast React single-page app with Vite and TypeScript",
    icon: "react",
    files: reactViteSpa,
  },
  {
    id: "express-api",
    name: "Express.js API",
    description: "RESTful API server with Express.js and TypeScript",
    icon: "express",
    files: nodeExpressApi,
  },
  {
    id: "ts-library",
    name: "TypeScript Library",
    description: "Starter template for building TypeScript libraries",
    icon: "typescript",
    files: typescriptLibrary,
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}

export { nextjsAppRouter as DEFAULT_FILES };
