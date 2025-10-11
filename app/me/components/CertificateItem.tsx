'use client';

import { CertificateItem } from '../hooks/types';
import { fmtDate } from '@/lib/date';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, FileDown, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CertificateCard({ item }: { item: CertificateItem }) {
  const [open, setOpen] = useState(false);

  const copyShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/me/certificates/${item.id}` : '';
    try {
      await navigator.clipboard.writeText(url);
      alert('Đã copy liên kết!');
    } catch {
      alert('Không copy được, vui lòng thử lại.');
    }
  };

  return (
    <Card className="min-w-[280px] max-w-[320px]">
      <CardHeader>
        <CardTitle className="text-sm">{item.courseTitle}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={item.status === 'VALID' ? 'default' : 'destructive'} aria-label={`status ${item.status}`}>
            {item.status}
          </Badge>
          {item.status === 'REVOKED' ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs underline cursor-help">?</span>
                </TooltipTrigger>
                <TooltipContent>Chứng chỉ đã bị thu hồi bởi hệ thống.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="text-xs text-gray-600">
        <p>Issued: {fmtDate(item.issuedAt)}</p>
        {item.tokenId ? <p>Token: #{item.tokenId}</p> : null}
        {item.ipfsCid ? <p>CID: {item.ipfsCid}</p> : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Link
          href={`/me/certificates/${item.id}`}
          className="text-xs underline focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="View certificate detail"
        >
          Xem
        </Link>

        <div className="flex items-center gap-2">
          {item.pdfUrl ? (
            <>
              <Button
                size="icon"
                variant="outline"
                aria-label="Download Certificate PDF"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = item.pdfUrl!;
                  a.download = `certificate_${item.id}.pdf`;
                  a.click();
                }}
              >
                <FileDown className="h-4 w-4" />
              </Button>

              {/* Preview modal */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-xs" aria-label="Preview PDF">
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Preview PDF</DialogTitle>
                  </DialogHeader>
                  <div className="h-[70vh]">
                    <iframe
                      title="Certificate PDF"
                      src={item.pdfUrl}
                      className="w-full h-full"
                      aria-label="Certificate PDF Preview"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : null}

          <Button size="icon" variant="outline" aria-label="Copy share link" onClick={copyShare}>
            <Share2 className="h-4 w-4" />
          </Button>

          {item.explorerUrl ? (
            <Link
              href={item.explorerUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open on-chain"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
