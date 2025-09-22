import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, title, message, onConfirm, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        {title && <DialogHeader>{title}</DialogHeader>}
        <p className="text-sm text-gray-700">{message}</p>
        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Sí, eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmModal;
