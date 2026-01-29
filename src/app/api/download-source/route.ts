import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const ROOT_FILES = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'tailwind.config.ts',
  'postcss.config.mjs',
  '.prettierrc',
  'eslint.config.mjs',
  'components.json',
  'README.md',
  'AGENTS.md',
];

const DIRECTORIES = ['src', 'public'];

const BEESTO_4K_ASSET = 'public/beesto-4k.svg';

async function addDirectoryToZip(zip: JSZip, dirPath: string, zipPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
        continue;
      }
      await addDirectoryToZip(zip, fullPath, entryZipPath);
    } else {
      try {
        const content = fs.readFileSync(fullPath);
        zip.file(entryZipPath, content);
      } catch {
        // Skip unreadable files
      }
    }
  }
}

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const zip = new JSZip();

    for (const dir of DIRECTORIES) {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await addDirectoryToZip(zip, dirPath, dir);
      }
    }

    for (const file of ROOT_FILES) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        zip.file(file, content);
      }
    }

    // Add Beesto 4K asset to root of zip for easy access
    const beesto4kPath = path.join(projectRoot, BEESTO_4K_ASSET);
    if (fs.existsSync(beesto4kPath)) {
      const content = fs.readFileSync(beesto4kPath);
      zip.file('beesto-4k.svg', content);
    }

    const buffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="beesto-source-${Date.now()}.zip"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to create archive' }, { status: 500 });
  }
}
