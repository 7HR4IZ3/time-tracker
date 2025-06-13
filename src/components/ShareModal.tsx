import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onCopy: () => void;
}

const ShareModal = ({ isOpen, onClose, url, onCopy }: ShareModalProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(onCopy);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this link to let others view this analysis with the same
            configuration:
          </p>
          <div className="flex gap-2">
            <Input value={url} readOnly />
            <Button onClick={handleCopy} variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
