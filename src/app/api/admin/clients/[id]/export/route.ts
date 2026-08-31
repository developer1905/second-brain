import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const REGISTRY_PATH = path.join(process.cwd(), 'prisma', 'clients', 'registry.json');
const CLIENTS_DIR = path.join(process.cwd(), 'prisma', 'clients');

// GET: Download client's blank DB file
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(raw);
    const client = registry.clients?.find((c: any) => c.id === params.id);

    if (!client) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    const dbPath = path.join(CLIENTS_DIR, client.dbFilename);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(dbPath);
    } catch {
      // File might not exist yet - create an empty placeholder
      fileBuffer = Buffer.alloc(0);
    }

    const safeClientName = client.name.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_');
    const filename = `SecondBrain_${safeClientName}_${new Date().toISOString().slice(0, 10)}.db`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
