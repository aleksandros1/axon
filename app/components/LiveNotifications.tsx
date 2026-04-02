'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // <-- Διορθωμένο Path!
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export default function LiveNotifications() {
  const router = useRouter();
  const [notification, setNotification] = useState<{id: string, name: string, text: string} | null>(null);

  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      channel = supabase.channel('global-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${userId}`
          },
          async (payload: any) => { // <-- Διορθωμένο το TypeScript Error εδώ!
            const newMessage = payload.new;

            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('company_name, email')
              .eq('id', newMessage.sender_id)
              .single();

            const senderName = senderProfile?.company_name || senderProfile?.email || 'Unknown Entity';
            const messageText = newMessage.text || (newMessage.is_offer ? 'Transmitted a new binding offer.' : 'Sent an attachment.');

            setNotification({
              id: newMessage.id,
              name: senderName,
              text: messageText
            });

            setTimeout(() => {
              setNotification(null);
            }, 4000);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!notification) return null;

  return (
    <div 
      className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-[400px] cursor-pointer"
      onClick={() => {
        setNotification(null);
        router.push('/inbox');
      }}
    >
      <div className="bg-[#1A1A1C]/85 backdrop-blur-2xl border border-white/10 p-3 md:p-4 rounded-3xl shadow-2xl flex items-center gap-3 md:gap-4 animate-in slide-in-from-top-10 fade-in duration-300">
        
        <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex-none flex items-center justify-center border border-white/5">
          <MessageSquare size={18} className="text-[#A6947D]" />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <h4 className="text-white font-semibold text-sm md:text-base truncate tracking-wide">
            {notification.name}
          </h4>
          <p className="text-gray-300 text-xs md:text-sm truncate">
            {notification.text}
          </p>
        </div>

      </div>
    </div>
  );
}