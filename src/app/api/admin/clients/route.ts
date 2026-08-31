import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const REGISTRY_PATH = path.join(process.cwd(), 'prisma', 'clients', 'registry.json');
const CLIENTS_DIR = path.join(process.cwd(), 'prisma', 'clients');
const TEMPLATE_DB = path.join(process.cwd(), 'prisma', 'blank_template.db');

async function getRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { clients: [] };
  }
}

async function saveRegistry(data: any) {
  await fs.mkdir(CLIENTS_DIR, { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET: List all clients
export async function GET() {
  const registry = await getRegistry();
  return NextResponse.json(registry);
}

// POST: Create new client + provision User account + blank DB
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, price, notes, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Mijoz ismi kiritilmadi' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email kiritilmadi' }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Parol kiritilmadi' }, { status: 400 });
    }

    await fs.mkdir(CLIENTS_DIR, { recursive: true });

    // 1. Create User in main DB
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json({ error: 'Bu email allaqachon ro\'yxatda bor' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        isActive: true,
        isAdmin: false,
      },
    });

    // 2. Copy blank template DB for client records
    const id = randomUUID();
    const dbFilename = `client_${id}.db`;
    const dbPath = path.join(CLIENTS_DIR, dbFilename);

    try {
      await fs.copyFile(TEMPLATE_DB, dbPath);
    } catch {
      await fs.writeFile(dbPath, '', 'utf-8');
    }

    // 3. Save client to registry
    const registry = await getRegistry();
    const newClient = {
      id,
      userId: user.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      company: company?.trim() || '',
      price: price || 0,
      notes: notes?.trim() || '',
      dbFilename,
      status: 'TAYYOR',
      createdAt: new Date().toISOString(),
    };

    registry.clients = registry.clients || [];
    registry.clients.push(newClient);
    await saveRegistry(registry);

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
