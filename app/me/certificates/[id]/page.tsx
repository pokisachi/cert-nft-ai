'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ExternalLink, FileDown, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import dayjs from 'dayjs';

export default function CertificateDetailPage() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['certificate', id],
    queryFn: async () => {
      const res = await fetch(`/api/me/certificates/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="w-full h-80 mb-6" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );

  if (error || !data)
    return <p className="p-6 text-red-500">Không thể tải chứng chỉ.</p>;

  const cert = data.item;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Đã copy liên kết!');
    } catch {
      alert('Không copy được, vui lòng thử lại.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 grid lg:grid-cols-2 gap-8">
      {/* Ảnh chứng chỉ */}
      <div className="rounded-lg overflow-hidden border bg-muted">
        <Image
          src={cert.imageUrl || '/certificate-placeholder.png'}
          alt={cert.courseTitle}
          width={600}
          height={400}
          className="object-cover w-full"
        />
      </div>

      {/* Thông tin chi tiết */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            {cert.courseTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Owner:</strong>{' '}
            <a
              href={`https://victionscan.io/address/${cert.ownerAddress}`}
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {cert.ownerAddress}
            </a>
          </div>
          <div>
            <strong>Contract Address:</strong>{' '}
            <a
              href={cert.explorerUrl}
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {cert.contractAddress}
            </a>
          </div>
          <div>
            <strong>Creator:</strong> {cert.creatorAddress || 'N/A'}
          </div>
          <div>
            <strong>Classification:</strong> Off-Chain (IPFS)
          </div>
          <div>
            <strong>Token ID:</strong> {cert.tokenId}
          </div>
          <div>
            <strong>Token Standard:</strong> ERC-721
          </div>
          <div>
            <strong>Issued At:</strong>{' '}
            {dayjs(cert.issuedAt).format('DD/MM/YYYY')}
          </div>

          <div className="flex gap-2 pt-4">
            {cert.pdfUrl && (
              <Button asChild variant="outline">
                <a href={cert.pdfUrl} download>
                  <FileDown className="w-4 h-4 mr-2" /> Tải PDF
                </a>
              </Button>
            )}
            {cert.explorerUrl && (
              <Button asChild variant="outline">
                <a href={cert.explorerUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Xem On-chain
                </a>
              </Button>
            )}
            <Button variant="secondary" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
