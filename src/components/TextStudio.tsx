import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Type, 
  Layers, 
  Download, 
  Trash2, 
  Plus, 
  Sparkles,
  X,
  Save,
  RotateCcw,
  Layout,
  Palette,
  ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TextStudioProps {
  initialImage?: string;
  onClose?: () => void;
  addLog?: (msg: string) => void;
}

const FONTS = [
  { name: 'Tajawal', value: 'Tajawal' },
  { name: 'Cairo', value: 'Cairo' },
  { name: 'Amiri', value: 'Amiri' },
  { name: 'Noto Naskh', value: 'Noto Naskh Arabic' }
];

export default function TextStudio({ initialImage, onClose, addLog }: TextStudioProps) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<fabric.Textbox | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<fabric.Rect | null>(null);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: (containerRef.current?.clientWidth || 800) - 48,
      height: 800,
      backgroundColor: '#0e1420',
      preserveObjectStacking: true,
      enableRetinaScaling: true,
    });

    fabricCanvas.on('selection:created', (e) => setActiveObject(e.selected?.[0] as fabric.Textbox || null));
    fabricCanvas.on('selection:updated', (e) => setActiveObject(e.selected?.[0] as fabric.Textbox || null));
    fabricCanvas.on('selection:cleared', () => setActiveObject(null));

    setCanvas(fabricCanvas);
    console.log("Fabric Canvas Initialized:", fabricCanvas.width, fabricCanvas.height);

    // Create Gradient Overlay
    const overlay = new fabric.Rect({
      left: 0,
      top: 0,
      width: fabricCanvas.width,
      height: fabricCanvas.height,
      selectable: false,
      evented: false,
      visible: false,
      opacity: 0,
    });
    fabricCanvas.add(overlay);
    overlayRef.current = overlay;
    overlay.sendToBack();

    // Load initial image if provided
    let isMounted = true;
    if (initialImage) {
      fabric.Image.fromURL(initialImage, (img) => {
        if (!isMounted || !fabricCanvas) return;
        const scale = Math.min(
          fabricCanvas.width! / img.width!,
          fabricCanvas.height! / img.height!
        );
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: fabricCanvas.width! / 2,
          top: fabricCanvas.height! / 2,
        });
        addLog?.("🖼️ تم تحميل الصورة في أداة النصوص.");
      }, { crossOrigin: 'anonymous' });
    }

    const handleResize = () => {
      if (fabricCanvas && containerRef.current) {
        const newWidth = containerRef.current.clientWidth - 48;
        fabricCanvas.setDimensions({
          width: newWidth,
          height: 800
        });
        if (overlayRef.current) {
          overlayRef.current.set({ width: newWidth });
        }
        fabricCanvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, []);

  // Update Overlay
  useEffect(() => {
    if (!canvas || !overlayRef.current) return;
    
    const overlay = overlayRef.current;
    if (overlayOpacity > 0) {
      overlay.set({
        visible: true,
        opacity: overlayOpacity / 100,
        fill: new fabric.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: 0, y2: canvas.height },
          colorStops: [
            { offset: 0, color: 'transparent' },
            { offset: 1, color: 'rgba(0,0,0,0.8)' }
          ]
        })
      });
    } else {
      overlay.set({ visible: false });
    }
    canvas.renderAll();
  }, [overlayOpacity, canvas]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target?.result as string, (img) => {
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: canvas.width! / 2,
          top: canvas.height! / 2,
        });
        addLog?.("✅ تم رفع الصورة بنجاح.");
      });
    };
    reader.readAsDataURL(file);
  };

  const addText = (text: string = "نص جديد", options: any = {}) => {
    if (!canvas) return;
    const textbox = new fabric.Textbox(text, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      width: 250,
      fontSize: 40,
      fontFamily: 'Tajawal',
      fill: '#ffffff',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      cornerColor: '#00d4ff',
      cornerStrokeColor: '#00d4ff',
      transparentCorners: false,
      borderColor: '#00d4ff',
      direction: 'rtl', // Arabic support
      lineHeight: 1.2,
      ...options
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    addLog?.("✨ تمت إضافة نص جديد.");
  };

  const applyTemplate = () => {
    addText("عرض خاص 🔥", {
      fill: '#00d4ff',
      fontSize: 70,
      fontWeight: 'bold',
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.5)',
        blur: 15,
        offsetX: 5,
        offsetY: 5
      })
    });
    addLog?.("🎨 تم تطبيق القالب الجاهز.");
  };

  const autoDesign = () => {
    if (!canvas) return;
    const obj = canvas.getActiveObject() as fabric.Textbox;
    if (!obj) {
      addLog?.("⚠️ يرجى اختيار نص أولاً.");
      return;
    }
    obj.set({
      fill: '#ffffff',
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.6)',
        blur: 15,
        offsetX: 5,
        offsetY: 5
      }),
      fontSize: 60
    });
    canvas.renderAll();
    addLog?.("⚡ تم تطبيق التصميم التلقائي.");
  };

  const saveProject = () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    localStorage.setItem('moonlight_project', json);
    addLog?.("💾 تم حفظ المشروع في المتصفح.");
  };

  const loadProject = () => {
    if (!canvas) return;
    const data = localStorage.getItem('moonlight_project');
    if (!data) {
      addLog?.("⚠️ لا يوجد مشروع محفوظ.");
      return;
    }
    canvas.loadFromJSON(data, () => {
      canvas.renderAll();
      addLog?.("🔄 تم استرجاع المشروع بنجاح.");
    });
  };

  const downloadResult = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 4 // Ultra Sharp 4K quality
    });
    const link = document.createElement('a');
    link.download = `moonlight-pro-4k-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    addLog?.("⬇️ تم تحميل التصميم بدقة 4K فائقة.");
  };

  const deleteActive = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.renderAll();
      addLog?.("🗑️ تم حذف العنصر.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[85vh]">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
        {/* Main Actions */}
        <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} />
              الأدوات السريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <button 
              onClick={() => addText()}
              className="w-full py-3 bg-primary/20 text-primary rounded-xl text-xs font-black hover:bg-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              إضافة نص
            </button>
            <button 
              onClick={applyTemplate}
              className="w-full py-3 bg-white/5 text-white rounded-xl text-xs font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              <Layout size={16} />
              قالب جاهز
            </button>
            <button 
              onClick={autoDesign}
              className="w-full py-3 bg-gold/10 text-gold rounded-xl text-xs font-black hover:bg-gold/20 transition-all flex items-center justify-center gap-2 border border-gold/20"
            >
              <Sparkles size={16} />
              تصميم تلقائي
            </button>
          </CardContent>
        </Card>

        {/* Project Management */}
        <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Save size={14} />
              إدارة المشروع
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <button 
              onClick={saveProject}
              className="py-3 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 border border-green-500/20"
            >
              <Save size={14} />
              حفظ
            </button>
            <button 
              onClick={loadProject}
              className="py-3 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 border border-blue-500/20"
            >
              <RotateCcw size={14} />
              استرجاع
            </button>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} />
              الصورة الخلفية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <Upload size={20} className="text-gray-500 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold text-gray-500">تغيير الخلفية</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </CardContent>
        </Card>

        {activeObject && (
          <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="p-4 border-b border-white/5">
              <CardTitle className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Type size={14} />
                إعدادات النص
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تباعد الأسطر</label>
                  <span className="text-[10px] text-primary font-bold">{activeObject.lineHeight?.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="3" step="0.1"
                  value={activeObject.lineHeight}
                  onChange={(e) => {
                    activeObject.set({ lineHeight: parseFloat(e.target.value) });
                    canvas?.renderAll();
                  }}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تباعد الحروف</label>
                  <span className="text-[10px] text-primary font-bold">{activeObject.charSpacing}</span>
                </div>
                <input 
                  type="range" min="-100" max="500" step="10"
                  value={activeObject.charSpacing}
                  onChange={(e) => {
                    activeObject.set({ charSpacing: parseInt(e.target.value) });
                    canvas?.renderAll();
                  }}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الخط</label>
                <select 
                  value={activeObject.fontFamily}
                  onChange={(e) => {
                    activeObject.set({ fontFamily: e.target.value });
                    canvas?.renderAll();
                  }}
                  className="w-full bg-black/20 border border-white/5 rounded-xl p-2 text-[10px] text-white outline-none"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visual Intelligence Overlay */}
        <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} />
              الذكاء البصري
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تعتيم ذكي (Gradient)</label>
                <span className="text-[10px] text-primary font-bold">{overlayOpacity}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-[9px] text-gray-600 italic leading-tight">يضيف طبقة تعتيم متدرجة خلف النص لتحسين القراءة.</p>
            </div>
          </CardContent>
        </Card>

        {activeObject && (
          <button 
            onClick={deleteActive}
            className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            حذف العنصر المختار
          </button>
        )}

        <button 
          onClick={downloadResult}
          className="w-full py-4 bg-gold text-black rounded-2xl font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2"
        >
          <Download size={18} />
          تحميل التصميم النهائي
        </button>
      </div>

      {/* Canvas Preview */}
      <div ref={containerRef} className="flex-1 bg-black/40 rounded-[2.5rem] border border-white/5 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
           <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>
        
        <div className="relative shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-dark min-w-[300px] min-h-[400px]">
          <canvas ref={canvasRef} />
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
