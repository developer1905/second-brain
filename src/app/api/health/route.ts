import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const startTime = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memory = process.memoryUsage();

  let dbStatus = 'DISCONNECTED';
  try {
    // Quick ping query to verify SQLite DB availability
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'CONNECTED';
  } catch (error) {
    dbStatus = 'ERROR';
  }

  return NextResponse.json(
    {
      status: 'OK',
      service: 'Second Brain AI Web App',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      uptimeFormatted: formatUptime(uptimeSeconds),
      database: dbStatus,
      memoryUsage: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
      botRunning: true,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days}d ${hours}h ${mins}m ${secs}s`;
}
