import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const REGISTRY_PATH = path.join(process.cwd(), 'prisma', 'clients', 'registry.json');
const CLIENTS_DIR   = path.join(process.cwd(), 'prisma', 'clients');

async function getRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // Return empty registry if file doesn't exist
    return { clients: [] };
  }
}

async function saveRegistry(registry: object) {
  await fs.mkdir(CLIENTS_DIR, { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

// DELETE: Remove client
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registry = await getRegistry();
    const client = registry.clients?.find((c: any) => c.id === params.id);
    if (!client) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    // Delete DB file safely
    try {
      await fs.unlink(path.join(CLIENTS_DIR, client.dbFilename));
    } catch { /* file may not exist */ }

    registry.clients = registry.clients.filter((c: any) => c.id !== params.id);
    await saveRegistry(registry);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update client status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body     = await request.json();
    const registry = await getRegistry();
    const idx      = registry.clients?.findIndex((c: any) => c.id === params.id) ?? -1;
    if (idx === -1) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }
    registry.clients[idx] = { ...registry.clients[idx], ...body };
    await saveRegistry(registry);
    return NextResponse.json({ success: true, client: registry.clients[idx] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
