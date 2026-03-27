'use client';
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onSignatureChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ label, onSignatureChange }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleEnd = () => {
    if (sigRef.current) {
      const dataUrl = sigRef.current.toDataURL('image/png');
      onSignatureChange(dataUrl);
      setIsEmpty(false);
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onSignatureChange(null);
    setIsEmpty(true);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="border rounded-lg bg-white relative">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: 'w-full h-24',
            style: { width: '100%', height: '96px' }
          }}
          onEnd={handleEnd}
        />
        {!isEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1"
            onClick={handleClear}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
