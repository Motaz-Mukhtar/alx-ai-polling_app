'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Share2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pollUrl: string;
  pollQuestion: string;
};

export default function QRCodeModal({ isOpen, onClose, pollUrl, pollQuestion }: Props) {
  if (!isOpen) return null;

  const downloadQRCode = () => {
    const svg = document.querySelector('#qr-code svg') as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `poll-qr-${Date.now()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const sharePoll = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vote on my poll',
          text: pollQuestion,
          url: pollUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(pollUrl);
        alert('Poll link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Share Poll</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {pollQuestion}
            </p>
            <div id="qr-code" className="flex justify-center mb-4">
              <QRCodeSVG
                value={pollUrl}
                size={200}
                level="M"
                includeMargin={true}
                className="border rounded-lg p-2 bg-white"
              />
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Scan this QR code to vote on mobile
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadQRCode}
              className="flex-1 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR
            </Button>
            <Button
              onClick={sharePoll}
              className="flex-1 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Or copy the link:</p>
            <div className="bg-gray-100 rounded-lg p-2 text-xs text-gray-700 break-all">
              {pollUrl}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
