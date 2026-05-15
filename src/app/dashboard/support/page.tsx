import { HelpCircle, Construction } from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-6 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
        <HelpCircle className="w-10 h-10 text-purple-500" />
      </div>
      <h1 className="text-2xl font-black tracking-tight text-white mb-3 uppercase">Help & Support</h1>
      <p className="text-zinc-400 max-w-sm mx-auto text-sm font-medium leading-relaxed mb-6">
        Need assistance? Our support team is here to help you get the most out of Fine Finance. 
        Documentation and live chat support will be available soon.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 text-sm font-bold uppercase tracking-widest">
        <Construction className="w-4 h-4" /> Coming Soon
      </div>
    </div>
  )
}
