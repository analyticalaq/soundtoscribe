import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioStream: MediaStream | null;
  isRecording: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioStream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    if (!audioStream || !isRecording || !canvasRef.current) return;
    
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#FF5252');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      source.disconnect();
      audioContext.close();
    };
  }, [audioStream, isRecording]);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded-lg bg-neutral-100 animate-fade-in"
      width={800}
      height={128}
    />
  );
};

export default AudioVisualizer;