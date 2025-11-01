import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { dataUrlToBase64 } from '../utils/fileUtils.ts';
import { X, UploadCloud, Wand2 } from 'lucide-react';

interface ImageEditorProps {
    onExit: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ onExit }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<{data: string, mimeType: string} | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editedImageSrc, setEditedImageSrc] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const handleImageUpload = (file: File) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setImageSrc(dataUrl);
                setEditedImageSrc(null);
                setError(null);
                setOriginalImage({ data: dataUrlToBase64(dataUrl), mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleEdit = useCallback(async () => {
        if (!originalImage || !prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: originalImage.data, mimeType: originalImage.mimeType, } }, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    setEditedImageSrc(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    return;
                }
            }
            throw new Error("Nenhuma imagem foi retornada pela API.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro durante a edição.");
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, prompt]);

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
             <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <h1 className="text-xl font-bold text-yellow-300">Editor Terapêutico</h1>
                <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {!imageSrc ? (
                    <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-gray-600 rounded-lg p-8">
                        <UploadCloud className="w-16 h-16 text-gray-500 mb-4" />
                        <h2 className="text-2xl font-semibold">Ancore sua Visão</h2>
                        <p className="text-gray-400 mt-2">Arraste uma imagem aqui ou clique para carregar.</p>
                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-2xl aspect-video bg-black rounded-lg mb-6 relative overflow-hidden">
                             <img src={imageSrc} alt="Original" className={`transition-opacity duration-500 w-full h-full object-contain ${editedImageSrc ? 'opacity-0' : 'opacity-100'}`} />
                             {editedImageSrc && <img src={editedImageSrc} alt="Edited" className="absolute inset-0 w-full h-full object-contain animate-fade-in" />}
                             {isLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-yellow-400"></div></div>}
                        </div>

                        <div className="w-full max-w-2xl">
                             <h3 className="text-lg font-semibold text-center mb-2">Qual é a sua intenção?</h3>
                             <div className="flex gap-2">
                                <input 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: 'um céu mais claro com um sol radiante...'"
                                    className="flex-1 bg-gray-800/80 border border-gray-600 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/80"
                                />
                                <button onClick={handleEdit} disabled={isLoading || !prompt.trim()} className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-900/50 disabled:cursor-not-allowed text-black font-bold p-3 rounded-full flex items-center justify-center">
                                    <Wand2 size={24} />
                                </button>
                             </div>
                             {error && <p className="text-red-400 text-center mt-2">{error}</p>}
                        </div>
                    </div>
                )}
            </main>
             {editedImageSrc && <footer className="text-center p-4 border-t border-gray-700/50">
                 <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-colors">Concluir Sessão</button>
             </footer>}
        </div>
    );
};

export default ImageEditor;
