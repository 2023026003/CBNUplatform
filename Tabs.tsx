@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --cbnu-blue: #1B4FD8;
  --cbnu-navy: #0F2B6F;
  --cbnu-accent: #F59E0B;
}

* { box-sizing: border-box; }

body {
  font-family: 'Noto Sans KR', system-ui, sans-serif;
}

@layer components {
  .btn-primary {
    @apply bg-cbnu-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-cbnu-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm;
  }
  .btn-secondary {
    @apply bg-white text-cbnu-blue border border-cbnu-blue px-4 py-2 rounded-lg font-medium hover:bg-cbnu-light transition-colors text-sm;
  }
  .btn-ghost {
    @apply text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors text-sm;
  }
  .card {
    @apply bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow;
  }
  .input {
    @apply w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cbnu-blue/30 focus:border-cbnu-blue transition-colors;
  }
  .label {
    @apply block text-sm font-medium text-slate-700 mb-1.5;
  }
  .badge {
    @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium;
  }
  .tag {
    @apply inline-block px-2.5 py-1 bg-cbnu-light text-cbnu-blue rounded-full text-xs font-medium;
  }
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
