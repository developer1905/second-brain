import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Database tozalanyapti va Obsidian neyron grafik seed ma'lumotlari kiritilmoqda...");

  // Clear existing data
  await prisma.backlinkEdge.deleteMany();
  await prisma.task.deleteMany();
  await prisma.note.deleteMany();
  await prisma.project.deleteMany();
  await prisma.area.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.telegramMessage.deleteMany();
  await prisma.githubRepo.deleteMany();
  await prisma.book.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.flashcard.deleteMany();

  // 1. Create Areas (Sohalar)
  const areaIT = await prisma.area.create({
    data: {
      name: "IT & Dasturlash",
      icon: "Code2",
      description: "Axborot texnologiyalari, Sun'iy Intellekt va Web dasturlash sohasidagi asosiy maqsadlar",
      metric: "12/15 Loyihalar Faol",
    },
  });

  const areaAI = await prisma.area.create({
    data: {
      name: "Agentic AI & LLMs",
      icon: "Brain",
      description: "Llama 3, DeepSeek R1, Claude 3.5 Sonnet va Agentik AI tizimlari",
      metric: "8 ta Tadqiqot Resursi",
    },
  });

  const areaHealth = await prisma.area.create({
    data: {
      name: "Salomatlik va Sport",
      icon: "Activity",
      description: "Jismoniy va ruhiy salomatlik, to'g'ri ovqatlanish hamda har kunlik mashqlar",
      metric: "Haftada 4 kun zal",
    },
  });

  const areaFinance = await prisma.area.create({
    data: {
      name: "Moliya & Investitsiya",
      icon: "DollarSign",
      description: "Shaxsiy byudjetni boshqarish, kriptovalyuta hamda aksiyalar portfeli",
      metric: "$20,000 Jamg'arma Maqsadi",
    },
  });

  const areaPersonal = await prisma.area.create({
    data: {
      name: "Shaxsiy Rivojlanish",
      icon: "BookOpen",
      description: "Kitoblar mutolaasi, til o'rganish va yetakchilik ko'nikmalarini oshirish",
      metric: "Oyiga 3 ta Kitob",
    },
  });

  // 2. Create Projects (Loyihalar)
  const projectSecondBrain = await prisma.project.create({
    data: {
      name: "Second Brain AI Tizimi",
      description: "P.A.R.A metodologiyasi va 3D Neyron Grafik asosidagi shaxsiy bilimlar bazasi",
      status: "IN_PROGRESS",
      progress: 90,
      deadline: "2026-09-01",
      tags: "AI,NextJS,Prisma,ThreeJS,Obsidian",
      areaId: areaIT.id,
      tasks: {
        create: [
          { title: "Obsidian 3D Force Graph neyron vizualizatsiyasini 60fps sozlash", status: "DONE", priority: "HIGH" },
          { title: "Telegram result.json parser va avtomatik resurs bog'lanishini ulash", status: "DONE", priority: "HIGH" },
          { title: "TipTap tahrirlovchisida [[Backlink]] fuzzy autocompletion yaratish", status: "DONE", priority: "HIGH" },
          { title: "Web Audio API orqali Ovozli Memo yozib olish funksiyasini ulash", status: "DONE", priority: "MEDIUM" },
        ],
      },
    },
  });

  const projectSpeechAI = await prisma.project.create({
    data: {
      name: "O'zbek Tili Ovozli AI Agent",
      description: "Whisper-v3 va Llama 3 modelini O'zbek tili uchun fine-tune qilish va ovozli buyruqlar",
      status: "IN_PROGRESS",
      progress: 65,
      deadline: "2026-10-15",
      tags: "Python,AI,Whisper,Llama3,FineTune",
      areaId: areaAI.id,
      tasks: {
        create: [
          { title: "100 soatlik O'zbekcha audio ma ma'lumotlar to'plamini yig'ish", status: "DONE", priority: "HIGH" },
          { title: "Whisper-Large-v3 modelini O'zbek tili aktsentiga sozlash", status: "IN_PROGRESS", priority: "HIGH" },
        ],
      },
    },
  });

  const projectGameDev = await prisma.project.create({
    data: {
      name: "AI Bilan O'yin Yasash (Game Engine)",
      description: "Claude 3.5 Sonnet va Three.js yordamida 3D brauzer o'yinini yaratish",
      status: "IN_PROGRESS",
      progress: 45,
      deadline: "2026-11-01",
      tags: "ThreeJS,AI,GameDev,JavaScript",
      areaId: areaIT.id,
    },
  });

  const projectFitness = await prisma.project.create({
    data: {
      name: "Marafon Tayyorgarligi 2026",
      description: "21km Yarim Marafon yugurish musobaqasiga jismoniy tayyorgarlik rejasi",
      status: "IN_PROGRESS",
      progress: 50,
      deadline: "2026-11-20",
      tags: "Sport,Yugurish,Kardio",
      areaId: areaHealth.id,
    },
  });

  // 3. Create Rich Uzbek & AI Ecosystem Notes (Dense Graph Nodes)
  const notesData = [
    {
      title: "Tiago Forte P.A.R.A Metodologiyasi Qoidalari",
      content: "P.A.R.A bu bilimni 4 toifaga ajratish: Projects, Areas, Resources, Archive. [[Second Brain AI Tizimi]] va [[Obsidian-cli Workflow]] bilan ulangan.",
      paraCategory: "RESOURCE", sourceType: "NOTE", tags: "PARA,Productivity,Obsidian,Knowledge", projectId: projectSecondBrain.id
    },
    {
      title: "Obsidian 3D Neural Graph Vizualizatsiyasi",
      content: "Obsidian uslubidagi 3D Neyron Grafik visualizer barcha [[Neat Code va Arxitektura Tamoyillari]] va [[Vector Database & Embeddings]] tugunlarini sinaptik nurli chiziqlar bilan bog'laydi.",
      paraCategory: "PROJECT", sourceType: "NOTE", tags: "GraphView,Obsidian,ThreeJS,WebGL", projectId: projectSecondBrain.id
    },
    {
      title: "Claude Design'ni 13 Daqiqada O'rganing",
      content: "Claude 3.5 Sonnet yordamida zamonaviy UI/UX komponentlarni tezkor yaratish yo'riqnomasi. [[AI Bilan O'yin Yasash (Game Engine)]] uchun ishlatiladi.",
      paraCategory: "RESOURCE", sourceType: "NOTE", tags: "Claude35,Design,UIUX,Prompting"
    },
    {
      title: "Grok 3 Eng Kuchli AI Modeli Tahlili",
      content: "Grok 3 va DeepSeek R1 mantiqiy fikrlash sinovlarida GPT-4o va Claude 3.5 Sonnetdan o'zib ketdi. [[O'zbek Tili Ovozli AI Agent]] arxitekturasida sinash lozim.",
      paraCategory: "RESOURCE", sourceType: "NOTE", tags: "Grok3,DeepSeekR1,LLM,Benchmark", areaId: areaAI.id
    },
    {
      title: "Kommentda 2 Deb Yozib Qoldiring (AI Trend)",
      content: "Instagram va Telegramdagi AI avtomatizatsiya boti: foydalanuvchi komment yozganda bot avtomatik prompt va [[Obsidian-cli Workflow]] qo'llanmasini yuboradi.",
      paraCategory: "RESOURCE", sourceType: "NOTE", tags: "Instagram,Automation,Bot,Telegram"
    },
    {
      title: "AI Bilan O'yin Yasash (Fast Game Prototype)",
      content: "Three.js va Canvas 2D yordamida 10 minutda mini o'yin yaratish kodi. [[AI Bilan O'yin Yasash (Game Engine)]] va [[Neat Code va Arxitektura Tamoyillari]] ga ulangan.",
      paraCategory: "PROJECT", sourceType: "NOTE", tags: "GameDev,Canvas,JavaScript,AI", projectId: projectGameDev.id
    },
    {
      title: "Neat Code va Arxitektura Tamoyillari",
      content: "SOLID, DRY va Clean Architecture tamoyillari. [[Second Brain AI Tizimi]] va [[Obsidian 3D Neural Graph Vizualizatsiyasi]] modullarida qo'llaniladi.",
      paraCategory: "AREA", sourceType: "NOTE", tags: "CleanCode,Architecture,TypeScript", areaId: areaIT.id
    },
    {
      title: "Vector Database & Embeddings (LanceDB / pgvector)",
      content: "Semantik qidiruv va RAG tizimlari uchun vector indekslash. [[Grok 3 Eng Kuchli AI Modeli Tahlili]] hamda [[Obsidian 3D Neural Graph Vizualizatsiyasi]] bilan bog'langan.",
      paraCategory: "RESOURCE", sourceType: "NOTE", tags: "VectorDB,RAG,LanceDB,pgvector", areaId: areaAI.id
    },
    {
      title: "Ovozli Eslatma: Speech Recognition & Whisper",
      content: "Whisper Large-v3 modelini O'zbek tili uchun fine-tune qilish va audio fayllardan matn ajratish. [[O'zbek Tili Ovozli AI Agent]] loyihasining yadrosi.",
      paraCategory: "PROJECT", sourceType: "VOICE", tags: "VoiceMemo,Whisper,STT,Uzbek", projectId: projectSpeechAI.id
    },
    {
      title: "Obsidian-cli va Agentic Workflows",
      content: "Terminal orqali Obsidian bilimlar bazasini boshqarish va AI agentlarni ulash. [[Tiago Forte P.A.R.A Metodologiyasi Qoidalari]] bilan ulangan.",
      paraCategory: "RESOURCE", sourceType: "NOTE", tags: "Obsidian,CLI,AgenticAI,Terminal"
    },
    {
      title: "Next.js 14 App Router & Server Actions",
      content: "React Server Components, Server Actions va Tailwind CSS yordamida enterprise darajadagi platformalar qurish.",
      paraCategory: "AREA", sourceType: "NOTE", tags: "NextJS,React,Tailwind,TypeScript", areaId: areaIT.id
    },
    {
      title: "DeepSeek R1 Open-Source Reasoning",
      content: "DeepSeek R1 modelini mahalliy GPU da ishga tushirish va Ollama / vLLM bilan integratsiya qilish.",
      paraCategory: "RESOURCE", sourceType: "NOTE", tags: "DeepSeek,Reasoning,Ollama,LocalAI", areaId: areaAI.id
    },
  ];

  const createdNotes: any[] = [];
  for (const n of notesData) {
    const note = await prisma.note.create({ data: n as any });
    createdNotes.push(note);
  }

  // 4. Create Resources (Books, Telegram Messages, GitHub Repos)
  await prisma.resource.createMany({
    data: [
      {
        title: "Clean Code Uzbekcha (Robert C. Martin)",
        type: "BOOK",
        summary: "Dasturchilar uchun kod tozaligi, refaktoring va sifat standartlari haqidagi kitob.",
        tags: "Kitob,CleanCode,Dasturlash",
        url: "https://amazon.com/dp/0132350882",
      },
      {
        title: "Telegram: AI Jamiyati — Llama-3 Uzbek Fine-Tune",
        type: "TELEGRAM",
        summary: "Telegram post: Uzbek tili uchun Llama 3 8B modelini LoRA usuli bilan tezkor o'rgatish yo'riqnomasi.",
        tags: "Telegram,Llama3,LoRA,AI",
        url: "https://t.me/ai_uzbekistan/142",
      },
      {
        title: "GitHub Repo: vercel/next.js App Router",
        type: "GITHUB",
        summary: "Next.js 14 App Router, Server Actions va React Server Components uchun rasmiy repozitoriya.",
        tags: "GitHub,NextJS,React",
        url: "https://github.com/vercel/next.js",
      },
      {
        title: "GitHub Repo: langchain-ai/langchainjs",
        type: "GITHUB",
        summary: "Agentik AI va RAG ilovalari uchun eng omborbop JavaScript framework.",
        tags: "GitHub,LangChain,AgenticAI,JS",
        url: "https://github.com/langchain-ai/langchainjs",
      },
    ],
  });

  // 5. Telegram Messages
  await prisma.telegramMessage.createMany({
    data: [
      {
        telegramId: 2001,
        chatName: "AI & Data Science Uzbekistan",
        text: "Grok 3 va DeepSeek R1 modellari haqida batafsil ma'lumot. [[Grok 3 Eng Kuchli AI Modeli Tahlili]] ga ulandi.",
        date: "2026-08-01 14:30",
        mediaType: "text",
        paraCategory: "RESOURCE",
      },
      {
        telegramId: 2002,
        chatName: "Saved Messages (Saqlanganlar)",
        text: "Kommentda 2 deb yozib qoldiring trendi va AI agent oqimlari. [[Kommentda 2 Deb Yozib Qoldiring (AI Trend)]] loyihasiga qarang.",
        date: "2026-08-04 09:12",
        mediaType: "link",
        paraCategory: "PROJECT",
      },
      {
        telegramId: 2003,
        chatName: "DevOps & Cloud Community",
        text: "Docker containerlarni Multi-stage build va Kubernetes orqali klasterlash.",
        date: "2026-08-06 18:45",
        mediaType: "text",
        paraCategory: "RESOURCE",
      },
    ],
  });

  // 6. GitHub Repositories
  await prisma.githubRepo.createMany({
    data: [
      {
        name: "second-brain-uz",
        fullName: "user/second-brain-uz",
        description: "P.A.R.A va 3D Neural Knowledge Graph platformasi Next.js 14 va TypeScript da",
        url: "https://github.com/user/second-brain-uz",
        stars: 342,
        forks: 89,
        language: "TypeScript",
        readmeContent: "# Second Brain AI\nO'zbek tilidagi 3D Vizual Neyron Grafik tizimi.",
      },
      {
        name: "uzbek-whisper-stt",
        fullName: "user/uzbek-whisper-stt",
        description: "OpenAI Whisper modelini O'zbek tili uchun fine-tune qilish kodi",
        url: "https://github.com/user/uzbek-whisper-stt",
        stars: 215,
        forks: 44,
        language: "Python",
        readmeContent: "# Uzbek Whisper Speech to Text\nFine-tuned model for Uzbek accents.",
      },
      {
        name: "obsidian-3d-force-graph",
        fullName: "user/obsidian-3d-force-graph",
        description: "Obsidian uslubidagi 3D Force-Directed Neural Knowledge Network",
        url: "https://github.com/user/obsidian-3d-force-graph",
        stars: 580,
        forks: 120,
        language: "TypeScript",
        readmeContent: "# Obsidian 3D Neural Graph",
      },
    ],
  });

  // 7. Books
  await prisma.book.createMany({
    data: [
      {
        title: "Clean Code Uzbekcha",
        author: "Robert C. Martin",
        totalPages: 450,
        currentPage: 300,
        fileType: "PDF",
        summary: "Dasturchilar uchun kod tozaligi va sifat standartlari.",
        highlights: JSON.stringify([
          "Kod bu kitob kabi oson o'qilishi lozim.",
          "Funksiya faqat bitta vazifani bajarishi shart."
        ]),
      },
      {
        title: "Atom Odatlar (Atomic Habits)",
        author: "James Clear",
        totalPages: 320,
        currentPage: 320,
        fileType: "EPUB",
        summary: "Har kuni 1% yaxshilanish orqali ulkan natijalarga erishish tizimi.",
        highlights: JSON.stringify([
          "Siz o'z maqsadlaringiz darajasiga ko'tarilmaysiz, balki tizimlaringiz darajasiga tushasiz."
        ]),
      },
      {
        title: "Uchdan Keyin Kech",
        author: "Masaru Ibuka",
        totalPages: 240,
        currentPage: 180,
        fileType: "PDF",
        summary: "Miya potensialini erta yoshdan oshirish sirlari.",
        highlights: JSON.stringify([
          "Erta yoshdagi ta'lim qiziquvchanlikni uyg'otishdir."
        ]),
      },
    ],
  });

  // 8. Create Inter-connected Backlinks (Spiderweb Edges)
  if (createdNotes.length >= 6) {
    await prisma.backlinkEdge.createMany({
      data: [
        { sourceId: createdNotes[0].id, targetId: createdNotes[1].id, label: "_index" },
        { sourceId: createdNotes[1].id, targetId: createdNotes[6].id, label: "README" },
        { sourceId: createdNotes[2].id, targetId: createdNotes[5].id, label: "workflow" },
        { sourceId: createdNotes[3].id, targetId: createdNotes[7].id, label: "llm-wiki" },
        { sourceId: createdNotes[4].id, targetId: createdNotes[9].id, label: "obsidian-cli" },
        { sourceId: createdNotes[5].id, targetId: createdNotes[1].id, label: "schema" },
        { sourceId: createdNotes[7].id, targetId: createdNotes[8].id, label: "vector-search" },
        { sourceId: createdNotes[9].id, targetId: createdNotes[0].id, label: "para-rules" },
        { sourceId: createdNotes[10].id, targetId: createdNotes[1].id, label: "nextjs-app" },
        { sourceId: createdNotes[11].id, targetId: createdNotes[3].id, label: "reasoning" },
      ],
    });
  }

  // 9. Personal Finance Transactions (Kirim - Chiqim)
  await prisma.transaction.createMany({
    data: [
      { title: "Senior Developer Oylik Maosh", amount: 2500, type: "INCOME", category: "Maosh", date: "2026-08-01", description: "Avgust oyi ish haqi" },
      { title: "AI Bot Yaratish Frilans Loyihasi", amount: 800, type: "INCOME", category: "Frilans", date: "2026-08-05", description: "Telegram bot avtomatizatsiyasi" },
      { title: "Korzinka Oziq-ovqat va Mahsulotlar", amount: 120, type: "EXPENSE", category: "Oziq-ovqat", date: "2026-08-03", description: "Haftalik oziq-ovqat" },
      { title: "Benzin va Avto Xarajatlar", amount: 65, type: "EXPENSE", category: "Transport", date: "2026-08-06", description: "Yoqilg'i quydirish" },
      { title: "S&P 500 va Kripto Aksiyalar", amount: 500, type: "EXPENSE", category: "Investitsiya", date: "2026-08-07", description: "Oylik jamg'arma investitsiyasi" },
    ],
  });

  // 10. Habits Seed Data
  const habit1 = await prisma.habit.create({
    data: {
      title: "Har kuni 30 daqiqa Kitob Mutolaasi",
      category: "Kitobxonlik",
      streakCount: 12,
      targetDays: 7,
      logs: {
        create: [
          { date: "2026-08-08", completed: true },
          { date: "2026-08-07", completed: true },
          { date: "2026-08-06", completed: true },
          { date: "2026-08-05", completed: true },
        ],
      },
    },
  });

  const habit2 = await prisma.habit.create({
    data: {
      title: "AI Dasturlash va Kod Yozish Mashqi",
      category: "Dasturlash",
      streakCount: 8,
      targetDays: 5,
      logs: {
        create: [
          { date: "2026-08-08", completed: true },
          { date: "2026-08-07", completed: true },
          { date: "2026-08-06", completed: true },
        ],
      },
    },
  });

  // 11. Flashcards Seed Data
  await prisma.flashcard.createMany({
    data: [
      {
        question: "Tiago Forte P.A.R.A metodologiyasining 4 asosiy komponenti qaysilar?",
        answer: "Projects (Loyihalar), Areas (Sohalar), Resources (Resurslar), Archive (Arxiv)",
        difficulty: "EASY",
        reviewCount: 3,
      },
      {
        question: "Active Recall va Spaced Repetition (Interval Takrorlash) afzalligi nima?",
        answer: "Miyadagi sinaptik xotira aloqalarini kuchaytirib, bilimlarni uzoq muddatli xotiraga o'tkazadi.",
        difficulty: "MEDIUM",
        reviewCount: 2,
      },
      {
        question: "DeepSeek R1 modelining asosiy ustunligi nimada?",
        answer: "Mantiqiy fikrlash (Reasoning) va ochiq manbali (Open-Source) LLM arxitekturasiga egaligi.",
        difficulty: "EASY",
        reviewCount: 4,
      },
    ],
  });

  console.log("🎉 Obsidian neyron grafik seed ma'lumotlari muvaffaqiyatli joylashtirildi!");
}

main()
  .catch((e) => {
    console.error("❌ Seed xatosi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
