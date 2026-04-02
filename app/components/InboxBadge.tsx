'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Προσοχή στο path αν χρειαστεί

export default function InboxBadge() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const initBadge = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Ελέγχουμε αν έχει ήδη αδιάβαστες ειδοποιήσεις όταν ανοίγει το app
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);
        
      if (count && count > 0) setHasUnread(true);

      // 2. Ακούμε LIVE τη βάση για νέα μηνύματα ώστε να ανάψει αμέσως!
      supabase.channel('red-dot')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${session.user.id}` }, () => setHasUnread(true))
        .subscribe();
    };

    initBadge();
  }, []);

  if (!hasUnread) return null;

  // INSTAGRAM STYLE RED DOT (#FF204E) ΜΕ ΣΚΟΥΡΟ ΠΕΡΙΓΡΑΜΜΑ ΓΙΑ ΑΝΤΙΘΕΣΗ
  return (
    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF204E] border-[2px] border-[#01030A] rounded-full shadow-[0_0_10px_rgba(255,32,78,0.6)] z-20 animate-in zoom-in duration-300"></span>
  );
}