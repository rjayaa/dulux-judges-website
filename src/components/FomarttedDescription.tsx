"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Props untuk komponen Description
interface FormattedDescriptionProps {
  text: string;
  maxLines?: number;
  className?: string;
  initialExpanded?: boolean;
}

export default function FormattedDescription({ 
  text, 
  maxLines = 3,
  className = "",
  initialExpanded = false
}: FormattedDescriptionProps) {
  const [showFull, setShowFull] = useState(initialExpanded);
  const [formattedText, setFormattedText] = useState("");
  const [isLongText, setIsLongText] = useState(false);
  
  // Format teks saat komponen dimount atau teks berubah
  useEffect(() => {
    if (!text) {
      setFormattedText("");
      setIsLongText(false);
      return;
    }
    
    // Format teks
    const formatted = formatText(text);
    setFormattedText(formatted);
    
    // Perkirakan panjang teks (sekitar 100 karakter per baris untuk 3 baris)
    setIsLongText(formatted.length > maxLines * 100);
  }, [text, maxLines]);
  
  // Format teks - normalisasi spasi, kapitalisasi awal kalimat, dll
  const formatText = (text: string) => {
    if (!text) return "";
    
    // Hapus spasi berlebih di awal dan akhir
    let formatted = text.trim();
    
    // Normalisasi line breaks
    formatted = formatted.replace(/\r\n/g, '\n');
    
    // Hapus spasi berlebih antar kata
    formatted = formatted.replace(/[ \t]+/g, ' ');
    
    // Memastikan spasi setelah tanda baca
    formatted = formatted.replace(/([.,!?:;])([^\s])/g, '$1 $2');
    
    // Menghapus spasi di depan tanda baca
    formatted = formatted.replace(/\s+([.,!?:;])/g, '$1');
    
    // Perbaiki line breaks berlebih (lebih dari 2 menjadi 2 saja)
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Hapus spasi di awal paragraf
    formatted = formatted.replace(/\n\s+/g, '\n');
    
    return formatted;
  };
  
  // Hapus ketika tidak ada teks
  if (!text || text.trim() === '') {
    return null;
  }
  
  return (
    <div className={`relative ${className}`}>
      <div 
        className={`text-gray-700 text-sm transition-all duration-300 ${
          showFull 
            ? 'max-h-none' 
            : `max-h-[${maxLines * 1.5}rem] overflow-hidden`
        }`}
        style={!showFull ? { maxHeight: `${maxLines * 1.5}rem` } : {}}
      >
        <p className="whitespace-pre-line leading-relaxed">
          {formattedText}
        </p>
      </div>
      
      {/* Gradient fade effect hanya jika teks panjang dan tidak dalam mode expanded */}
      {!showFull && isLongText && (
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-10"></div>
      )}
      
      {/* Tombol show more/less hanya jika teks cukup panjang */}
      {isLongText && (
        <button 
          onClick={() => setShowFull(!showFull)}
          className="mt-1 text-primary hover:text-primary/80 text-xs font-medium flex items-center relative z-20"
          aria-expanded={showFull}
        >
          {showFull ? (
            <>
              <span>Show less</span>
              <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              <span>Show more</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </button>
      )}
    </div>
  );
}