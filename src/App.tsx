import { useState } from 'react';
import Home from './components/Home';
import DailyPage from './components/DailyPage';
import Archive from './components/Archive';

type Tab = 'home' | 'daily' | 'archive';
const today = new Date().toISOString().split('T')[0];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">
      <div className="flex-1 pb-20 overflow-y-auto">
        {tab === 'home' && <Home today={today} onNavigate={t => setTab(t as Tab)} />}
        {tab === 'daily' && <DailyPage today={today} />}
        {tab === 'archive' && <Archive />}
      </div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 flex justify-around items-center py-3 px-6">
        {([{id:'home',icon:'🏠',label:'홈'},{id:'daily',icon:'📅',label:'일별'},{id:'archive',icon:'🗂️',label:'아카이브'}] as {id:Tab;icon:string;label:string}[]).map(item => (
          <button key={item.id} onClick={()=>setTab(item.id)} className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${tab===item.id?'text-green-600':'text-gray-400 hover:text-gray-600'}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
