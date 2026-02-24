
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Volume2, VolumeX } from 'lucide-react';

export function SoundManager() {
  const { theme } = useTheme();
  // IMPORTANT: Set initial state to true (muted) to disable auto-play
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      audioRef.current.onerror = () => {
          console.warn("Audio source failed to load.");
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (!audioRef.current) return;

    let soundUrl = '';
    switch (theme) {
      case 'minimalist':
        soundUrl = '/sounds/minimalist.mp3'; 
        break;
      case 'cosmic':
        soundUrl = '/sounds/cosmic.mp3'; 
        break;
      case 'retro':
        soundUrl = '/sounds/retro.mp3'; 
        break;
      case 'neon':
        soundUrl = '/sounds/neon.mp3'; 
        break;
      default:
        soundUrl = '';
    }

    const currentAudio = audioRef.current;
    const needsUpdate = soundUrl && !currentAudio.src.endsWith(soundUrl);

    if (needsUpdate) {
      currentAudio.src = soundUrl;
      
      // Only attempt to play if NOT muted
      if (!isMuted) {
        const playPromise = currentAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Autoplay prevented:", error);
            setIsMuted(true);
          });
        }
      }
    }
  }, [theme, isMuted]);

  // Handle Mute/Unmute toggle
  useEffect(() => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.pause();
    } else {
      if (audioRef.current.src) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Playback failed:", error);
            setIsMuted(true);
          });
        }
      }
    }
  }, [isMuted]);

  // Return NULL to disable the settings button (hide the UI)
  // The audio logic still runs in the background, but the button is gone.
  // Since isMuted defaults to true, no sound will play.
  // If you want sound to play by default but no button, you'd change isMuted to false,
  // but browsers block autoplay.
  
  // Requirement: "Disable the settings button"
  // If the user wants to completely disable the feature (no sound, no button), returning null is correct.
  // If the user wants sound but no button (uncontrollable), that violates browser policy.
  // Assuming intent is to hide the control UI.
  return null;
}
