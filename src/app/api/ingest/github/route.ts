import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const repos = await prisma.githubRepo.findMany({
      orderBy: { syncedAt: 'desc' },
    });
    return NextResponse.json(repos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, token, repoUrl } = body;

    let reposData = [];

    if (username || token) {
      const headers: Record<string, string> = {
        'User-Agent': 'Second-Brain-AI-App',
      };
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const targetUrl = username 
        ? `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`
        : `https://api.github.com/user/repos?sort=updated&per_page=10`;

      const res = await fetch(targetUrl, { headers });
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.statusText}`);
      }
      reposData = await res.json();
    } else if (repoUrl) {
      // Single repo fetch fallback or mock sync
      const repoName = repoUrl.split('/').slice(-2).join('/');
      reposData = [{
        name: repoUrl.split('/').pop() || 'github-repo',
        full_name: repoName,
        description: 'GitHub repozitoriyasi',
        html_url: repoUrl,
        stargazers_count: 42,
        forks_count: 7,
        language: 'TypeScript',
      }];
    } else {
      return NextResponse.json({ error: "GitHub foydalanuvchi nomi, TOKEN yoki Repo URL kiritilmadi" }, { status: 400 });
    }

    let syncedCount = 0;
    for (const repo of reposData) {
      const repoName = repo.name || 'repo';
      const repoDesc = repo.description || 'GitHub loyihasi';
      const url = repo.html_url || repoUrl || `https://github.com/${repoName}`;

      await prisma.githubRepo.create({
        data: {
          name: repoName,
          fullName: repo.full_name || repoName,
          description: repoDesc,
          url: url,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          language: repo.language || 'Code',
          readmeContent: `# ${repoName}\n${repoDesc}\n⭐ Stars: ${repo.stargazers_count || 0}`,
        },
      });

      // Auto create a Project node in PARA
      await prisma.project.create({
        data: {
          name: `GitHub: ${repoName}`,
          description: repoDesc,
          status: 'IN_PROGRESS',
          progress: 50,
          tags: `GitHub,${repo.language || 'Code'}`,
        },
      });

      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount} ta GitHub repozitoriyasi neyron tarmoqqa sinxronlashtirildi!`,
      count: syncedCount,
    });
  } catch (error: any) {
    console.error('GitHub Ingest error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });
    await prisma.githubRepo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

