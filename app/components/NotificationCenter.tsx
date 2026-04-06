'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, X, CheckCircle2, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [session, setSession] = useState<any>(null);

  // Φόρτωση Ειδοποιήσεων
  useEffect(() => {
    const fetchNotifs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSession(session);

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifs();

    // REAL-TIME LISTENER (Ακούει ζωντανά για νέες ειδοποιήσεις!)
    const channel = supabase.channel('realtime_notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          // Εδώ θα μπορούσαμε να παίξουμε και έναν ήχο
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAllAsRead = async () => {
    if (!session) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // UI Update
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // DB Update
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'payment': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'alert': return <AlertTriangle size={16} className="text-amber-400" />;
      default: return <MessageSquare size={16} className="text-[#A6947D]" />;
    }
  };

  return (
    <div className="fixed top-6 right-6 md:top-8 md:right-12 z-[100]">
      
      {/* ΤΟ ΚΑΜΠΑΝΑΚΙ */}
      <button 
        onClick={() => { setIsOpen(!isOpen); if(!isOpen) markAllAsRead(); }}
        className="relative bg-[#01030A]/80 backdrop-blur-xl border border-[#A6947D]/30 p-3 rounded-full shadow-2xl hover:border-[#A6947D] transition-all group"
      >
        <Bell size={20} className="text-[#A6947D] group-hover:animate-pulse" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#020509] animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ΤΟ DROPDOWN (IOS STYLE) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-[320px] md:w-[380px] bg-[#01030A]/95 backdrop-blur-2xl border border-[#A6947D]/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-top-4 duration-300">
          
          <div className="p-4 border-b border-[#A6947D]/10 flex justify-between items-center bg-[#020509]">
            <h3 className="text-[10px] font-bold text-[#A6947D] uppercase tracking-widest">System Transmissions</h3>
            <button onClick={() => setIsOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-400"><X size={16}/></button>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#A6947D]/40 text-[10px] uppercase tracking-widest font-mono">
                No active transmissions
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 border-b border-[#A6947D]/5 hover:bg-[#A6947D]/5 transition-colors flex gap-4 ${!n.is_read ? 'bg-[#A6947D]/10' : ''}`}>
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div>
                    <p className="text-xs font-bold text-[#F8F5EE] uppercase tracking-wider mb-1">{n.title}</p>
                    <p className="text-[10px] text-[#F8F5EE]/60 leading-relaxed mb-2">{n.message}</p>
                    <p className="text-[8px] text-[#A6947D]/40 font-mono">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}