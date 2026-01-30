'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioUrl?: string | null;
  isPlaying?: boolean;
}

export function AudioVisualizer({ audioUrl, isPlaying = false }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Particle system for ambient effect
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    hue: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const particleCount = 50;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.1,
      hue: Math.random() * 60 + 220, // Blue to purple range
    }));

    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.fillStyle = 'rgba(5, 5, 8, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get audio data if available
      let audioData: Uint8Array | null = null;
      let avgFrequency = 0;

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        audioData = dataArray;
        avgFrequency = Array.from(dataArray).reduce((a, b) => a + b, 0) / bufferLength / 255;
      }

      // Draw center glow
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const glowRadius = 200 + (avgFrequency * 200);

      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowRadius
      );
      gradient.addColorStop(0, `rgba(99, 102, 241, ${0.1 + avgFrequency * 0.2})`);
      gradient.addColorStop(0.5, `rgba(34, 211, 238, ${0.05 + avgFrequency * 0.1})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform circle if audio is playing
      if (audioData && isPlaying) {
        ctx.beginPath();
        const waveRadius = 150;
        const wavePoints = 128;

        for (let i = 0; i <= wavePoints; i++) {
          const angle = (i / wavePoints) * Math.PI * 2;
          const dataIndex = Math.floor((i / wavePoints) * audioData.length);
          const amplitude = audioData[dataIndex] / 255;
          const r = waveRadius + amplitude * 100;

          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.5 + avgFrequency * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glow
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.3 + avgFrequency * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw frequency bars at bottom
      if (audioData && isPlaying) {
        const barCount = 64;
        const barWidth = canvas.width / barCount;
        const maxBarHeight = 150;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * audioData.length);
          const value = audioData[dataIndex] / 255;
          const barHeight = value * maxBarHeight;

          const hue = 220 + (i / barCount) * 60;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${0.3 + value * 0.5})`;

          ctx.fillRect(
            i * barWidth,
            canvas.height - barHeight,
            barWidth - 2,
            barHeight
          );
        }
      }

      // Animate particles
      particlesRef.current.forEach((particle) => {
        // Apply audio reactivity
        const boost = avgFrequency * 2;
        particle.x += particle.vx * (1 + boost);
        particle.y += particle.vy * (1 + boost);

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1 + avgFrequency), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue + time * 10}, 70%, 60%, ${particle.alpha * (1 + avgFrequency)})`;
        ctx.fill();
      });

      // Draw ambient waves when no audio
      if (!isPlaying) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 - i * 0.01})`;
          ctx.lineWidth = 1;

          for (let x = 0; x < canvas.width; x += 5) {
            const y = canvas.height / 2 +
              Math.sin(x * 0.01 + time + i) * 50 +
              Math.sin(x * 0.02 + time * 1.5 + i) * 30;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Setup audio analyzer
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';
    setAudioElement(audio);

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;

    return () => {
      audio.pause();
      audioContext.close();
    };
  }, [audioUrl]);

  // Control playback
  useEffect(() => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.play().catch(console.error);
    } else {
      audioElement.pause();
    }
  }, [isPlaying, audioElement]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{ background: 'var(--void)' }}
    />
  );
}

// Simple animated waveform bars for loading states
export function WaveformBars({ count = 5, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`flex items-end gap-[3px] h-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full"
          style={{
            animation: `waveform 0.8s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
            height: '100%',
          }}
        />
      ))}
    </div>
  );
}
