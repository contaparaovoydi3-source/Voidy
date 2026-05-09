import React, { useState, useRef, useEffect } from 'react';

interface StickerEditorProps {
  imageUrl: string;
  onSave: (base64: string) => void;
  onCancel: () => void;
}

export default function StickerEditor({ imageUrl, onSave, onCancel }: StickerEditorProps) {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textPos, setTextPos] = useState({ x: 150, y: 250 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  const containerSize = 300;
  const outputSize = 512;
  const ratio = outputSize / containerSize;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
      const minScale = Math.max(containerSize / img.width, containerSize / img.height);
      setScale(minScale);
      setPos({
        x: (containerSize - img.width * minScale) / 2,
        y: (containerSize - img.height * minScale) / 2
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, isText: boolean) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (isText) setIsDraggingText(true);
    else setIsDragging(true);
    
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !isDraggingText) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    
    if (isDraggingText) {
      setTextPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (isDragging) {
      setPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingText(false);
  };

  const handleSave = () => {
    if (!imageObj) return;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, outputSize, outputSize);

    // Draw image
    ctx.drawImage(
      imageObj, 
      pos.x * ratio, 
      pos.y * ratio, 
      imageObj.width * scale * ratio, 
      imageObj.height * scale * ratio
    );

    // Draw text
    if (text) {
      ctx.font = `bold ${32 * ratio}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4 * ratio;
      ctx.strokeText(text, textPos.x * ratio, textPos.y * ratio);
      ctx.fillText(text, textPos.x * ratio, textPos.y * ratio);
    }

    onSave(canvas.toDataURL('image/png'));
  };

  if (!imageObj) return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <div className="text-white">Carregando...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0a0c1a] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Criar Figurinha</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="p-4 flex flex-col gap-6 items-center">
          {/* Editor Area */}
          <div 
            className="relative bg-black/50 rounded-xl overflow-hidden border border-white/10 shadow-inner"
            style={{ width: containerSize, height: containerSize, touchAction: 'none' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Image */}
            <div 
              className="absolute inset-0 cursor-move"
              onMouseDown={(e) => handleMouseDown(e, false)}
              onTouchStart={(e) => handleMouseDown(e, false)}
            >
              <img 
                src={imageUrl} 
                alt="Edit" 
                draggable={false}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: imageObj.width * scale,
                  height: imageObj.height * scale,
                  maxWidth: 'none',
                  pointerEvents: 'none'
                }} 
              />
            </div>

            {/* Text Overlay */}
            {text && (
              <div 
                className="absolute cursor-move text-3xl font-black text-center whitespace-nowrap select-none"
                style={{
                  left: textPos.x,
                  top: textPos.y,
                  transform: 'translate(-50%, -50%)',
                  color: textColor,
                  WebkitTextStroke: '1px black',
                  textShadow: '0 4px 8px rgba(0,0,0,0.8)'
                }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, true); }}
                onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, true); }}
              >
                {text}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 w-full">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zoom</label>
                <span className="text-[10px] text-cyan-400">{Math.round(scale * 100)}%</span>
              </div>
              <input 
                type="range" 
                min={0.1} 
                max={3} 
                step={0.01} 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Texto</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Adicionar texto..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <input 
                  type="color" 
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3 bg-black/20">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-colors text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-cyan-500 text-black font-black hover:bg-cyan-400 transition-colors text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            Salvar Figurinha
          </button>
        </div>
      </div>
    </div>
  );
}
