import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notes = await prisma.note.findMany({ include: { project: true, area: true } });
    const projects = await prisma.project.findMany({ include: { area: true, tasks: true } });
    const areas = await prisma.area.findMany();
    const resources = await prisma.resource.findMany();
    const telegrams = await prisma.telegramMessage.findMany();
    const repos = await prisma.githubRepo.findMany();
    const books = await prisma.book.findMany();
    const transactions = await prisma.transaction.findMany();

    const zip = new JSZip();

    // Helper to format Obsidian Frontmatter
    const buildMarkdown = (title: string, category: string, tags: string[], body: string, meta: Record<string, any> = {}) => {
      const yamlLines = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        `category: "${category}"`,
        `tags: [${tags.map((t) => `"${t.trim()}"`).join(', ')}]`,
        `created_at: "${meta.createdAt || new Date().toISOString()}"`,
      ];

      Object.entries(meta).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== 'createdAt') {
          yamlLines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`);
        }
      });

      yamlLines.push('---', '', `# ${title}`, '', body);
      return yamlLines.join('\n');
    };

    // 1. Notes -> Vault folders
    notes.forEach((n) => {
      const safeTitle = n.title.replace(/[\/\?<>\\:\*\|"]/g, '_');
      const folder = n.paraCategory.toLowerCase() + 's';
      const content = buildMarkdown(
        n.title,
        n.paraCategory,
        n.tags ? n.tags.split(',') : ['Note'],
        n.content || '',
        {
          project: n.project?.name || '',
          area: n.area?.name || '',
          createdAt: n.createdAt.toISOString(),
        }
      );
      zip.folder(folder)?.file(`${safeTitle}.md`, content);
    });

    // 2. Projects Folder
    projects.forEach((p) => {
      const safeTitle = p.name.replace(/[\/\?<>\\:\*\|"]/g, '_');
      const taskList = p.tasks.map((t) => `- [${t.status === 'COMPLETED' ? 'x' : ' '}] ${t.title}`).join('\n');
      const body = `### 🎯 Loyiha Maqsadi\n${p.description || ''}\n\n### 📋 Vazifalar (${p.tasks.length})\n${taskList || 'Vazifalar kiritilmagan'}`;
      const content = buildMarkdown(p.name, 'PROJECT', p.tags ? p.tags.split(',') : ['Loyiha'], body, {
        area: p.area?.name || '',
        deadline: p.deadline || '',
        progress: `${p.progress}%`,
        createdAt: p.createdAt.toISOString(),
      });
      zip.folder('projects')?.file(`${safeTitle}.md`, content);
    });

    // 3. Areas Folder
    areas.forEach((a) => {
      const safeTitle = a.name.replace(/[\/\?<>\\:\*\|"]/g, '_');
      const body = `### 🏛️ Hayotiy Soha\n${a.description || ''}`;
      const content = buildMarkdown(a.name, 'AREA', ['Soha', 'Hayotiy'], body, {
        createdAt: a.createdAt.toISOString(),
      });
      zip.folder('areas')?.file(`${safeTitle}.md`, content);
    });

    // 4. Resources Folder
    resources.forEach((r) => {
      const safeTitle = r.title.replace(/[\/\?<>\\:\*\|"]/g, '_');
      const body = `### 📚 Resurs\n${r.summary || ''}\n\n**Manba Havolasi:** ${r.url || 'Mavjud emas'}`;
      const content = buildMarkdown(r.title, 'RESOURCE', r.tags ? r.tags.split(',') : ['Resurs'], body, {
        url: r.url || '',
        sourceType: r.type,
        createdAt: r.createdAt.toISOString(),
      });
      zip.folder('resources')?.file(`${safeTitle}.md`, content);
    });

    // 5. Personal Finance Folder
    transactions.forEach((tx) => {
      const safeTitle = `Moliya_${tx.date}_${tx.title}`.replace(/[\/\?<>\\:\*\|"]/g, '_');
      const isIncome = tx.type === 'INCOME';
      const body = `### 💳 Moliyaviy Amaliyot\n**Tur:** ${isIncome ? 'Kirim (+)' : 'Chiqim (-)'}\n**Summa:** $${tx.amount}\n**Kategoriya:** ${tx.category}\n**Sana:** ${tx.date}\n\n${tx.description || ''}`;
      const content = buildMarkdown(tx.title, 'FINANCE', ['Moliya', isIncome ? 'Kirim' : 'Chiqim', tx.category], body, {
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        date: tx.date,
        createdAt: tx.createdAt.toISOString(),
      });
      zip.folder('finance')?.file(`${safeTitle}.md`, content);
    });

    // Add Obsidian Vault config file so Obsidian natively opens it!
    zip.folder('.obsidian')?.file(
      'app.json',
      JSON.stringify({ legacyEditor: false, livePreview: true, attachmentFolderPath: '/' }, null, 2)
    );

    // Generate zip Uint8Array buffer
    const zipArray = await zip.generateAsync({ type: 'uint8array' });

    return new NextResponse(zipArray as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Obsidian_Second_Brain_Vault_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
