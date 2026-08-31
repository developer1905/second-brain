'use client';

import React, { useState } from 'react';
import { FileText, Sparkles, Plus, Check } from 'lucide-react';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
}

export const OBSIDIAN_TEMPLATES: NoteTemplate[] = [
  {
    id: 'daily',
    name: '☀️ Kunlik Xulosa (Daily Reflection)',
    description: 'Bugungi maqsadlar, yutuqlar, xatolar va shukronalik',
    icon: '☀️',
    content: `## ☀️ Kunlik Xulosa — {{date}}

### 🎯 Bugungi Bosh Maqsadlar
- [ ] Maqsad 1
- [ ] Maqsad 2
- [ ] Maqsad 3

### 🏆 Erishilgan Yutuqlar
- Yutuq 1: 

### 💡 Bugungi Xulosa & Saboq
- 

### 💰 Kunlik Moliya & Odatlar
- Kirim / Chiqim:
- Bajarilgan odatlar: 

---
*#kunlik #xulosa #secondbrain*`,
  },
  {
    id: 'book',
    name: '📚 Kitob Xulosasi (Book Summary)',
    description: "Muallif, asosiy g'oyalar va iqtiboslar",
    icon: '📚',
    content: `## 📚 Kitob Tahlili: [[Kitob Nomi]]

**Muallif:** 
**Janr:** 
**Baho:** ⭐⭐⭐⭐⭐

### 💡 Asosiy Konseptlar & G'oyalar
1. **1-asosiy g'oya:** 
2. **2-asosiy g'oya:** 

### 💬 Eng Saralangan Iqtiboslar (Quotes)
> "..."

### 🚀 Amaliy Harakatlar (Actionable Takeaways)
- [ ] 

---
*#kitob #xulosa #resurs*`,
  },
  {
    id: 'project',
    name: '🎯 Loyiha Pasporti (Project Charter)',
    description: "Maqsadlar, etaplar, mas'ullar va KPI",
    icon: '🎯',
    content: `## 🎯 Loyiha: [[Loyiha Nomi]]

**Soha:** [[Soha Nomi]]
**Deadline:** {{date}}
**Status:** IN_PROGRESS

### 📌 Maqsad & Missiya
- 

### 🏁 Asosiy Bosqichlar (Milestones)
- [ ] 1-Bosqich: 
- [ ] 2-Bosqich: 
- [ ] 3-Bosqich: 

### 🔗 Tegishli Resurslar & Havolalar
- 

---
*#loyiha #para #kpi*`,
  },
  {
    id: 'meeting',
    name: '🤝 Uchrashuv Qaydi (Meeting Note)',
    description: 'Qatnashchilar, kun tartibi va kelishuvlar',
    icon: '🤝',
    content: `## 🤝 Uchrashuv: [[Mavzu]]

**Sana:** {{date}}
**Qatnashchilar:** @

### 📋 Kun Tartibi (Agenda)
1. 

### 📝 Muhokama Qilingan Masalalar
- 

### 🚀 Kelishilgan Harakatlar (Action Items)
- [ ] @odam: 

---
*#uchrashuv #qayd*`,
  },
];

interface TemplateSelectorProps {
  onSelectTemplate: (template: NoteTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelect = (t: NoteTemplate) => {
    const today = new Date().toISOString().split('T')[0];
    const filledContent = t.content.replace(/{{date}}/g, today);
    onSelectTemplate({ ...t, content: filledContent });
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-bold font-mono transition shadow-glowPurple"
      >
        <FileText className="w-3.5 h-3.5 text-purple-400" />
        <span>Obsidian Shablonlar</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 p-3 rounded-2xl glass-panel border border-purple-500/40 shadow-2xl bg-slate-950/98 space-y-2 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Obsidian Shablonini Tanlang
            </h4>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {OBSIDIAN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t)}
                className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                    {t.name}
                  </span>
                  {copiedId === t.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {t.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
