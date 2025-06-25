import { useState } from 'react';
import { Share2, Link, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SnapshotService } from '@/services/snapshotService';
import { ShareableSnapshot } from '@/types/snapshot';

interface ShareButtonProps {
  snapshot: ShareableSnapshot;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ShareButton = ({ 
  snapshot, 
  variant = 'outline', 
  size = 'default',
  className = '' 
}: ShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [title, setTitle] = useState(snapshot.title || '');
  const [description, setDescription] = useState(snapshot.description || '');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (shareUrl) {
      // If we already have a URL, just copy it
      await copyToClipboard();
      return;
    }

    setIsLoading(true);
    try {
      const updatedSnapshot = {
        ...snapshot,
        title: title || snapshot.title,
        description: description || snapshot.description,
      };

      const snapshotId = await SnapshotService.saveSnapshot(updatedSnapshot);
      const url = SnapshotService.generateShareableUrl(snapshotId);
      setShareUrl(url);

      toast({
        title: 'Snapshot saved!',
        description: 'Your shareable link has been generated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create shareable link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const resetDialog = () => {
    setShareUrl('');
    setCopied(false);
    setTitle(snapshot.title || '');
    setDescription(snapshot.description || '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Snapshot</DialogTitle>
          <DialogDescription>
            Create a shareable link for this timesheet snapshot with all data and settings.
          </DialogDescription>
        </DialogHeader>
        
        {!shareUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Timesheet Analysis"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this snapshot..."
                className="resize-none"
                rows={3}
              />
            </div>

            <Button 
              onClick={handleShare}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating link...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Generate Shareable Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex space-x-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={copyToClipboard}
                  variant={copied ? 'default' : 'outline'}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>This link contains your complete timesheet snapshot including:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>All time entries and data</li>
                <li>Current filters and settings</li>
                <li>Hourly rates and rounding preferences</li>
                <li>Invoice configuration (if applicable)</li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
