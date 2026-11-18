import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Star, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useListingMedia } from '@/hooks/useListings';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILES_PER_UPLOAD,
  MAX_MEDIA_PER_LISTING,
  validateImageFile,
} from '@/services/listing.service';
import type { ListingMedia } from '@/types/listing.types';
import { getErrorMessage } from './listingUtils';

interface PendingFile {
  file: File;
  preview: string;
}

export interface MediaUploaderProps {
  listingId: string;
  media: ListingMedia[];
  disabled?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ listingId, media, disabled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { upload, remove, setPrimary } = useListingMedia(listingId);

  const remaining = MAX_MEDIA_PER_LISTING - media.length - pending.length;

  // Release any remaining preview object URLs on unmount only
  const pendingRef = useRef<PendingFile[]>([]);
  pendingRef.current = pending;
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newErrors: string[] = [];
      const accepted: PendingFile[] = [];
      Array.from(fileList).forEach((file) => {
        const error = validateImageFile(file);
        if (error) newErrors.push(error);
        else if (accepted.length >= remaining) newErrors.push(`${file.name}: photo limit (${MAX_MEDIA_PER_LISTING}) reached.`);
        else accepted.push({ file, preview: URL.createObjectURL(file) });
      });
      setErrors(newErrors);
      setPending((prev) => [...prev, ...accepted]);
    },
    [remaining]
  );

  const removePending = (index: number) => {
    setPending((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    setErrors([]);
    // Upload in batches the server accepts
    for (let i = 0; i < pending.length; i += MAX_FILES_PER_UPLOAD) {
      const batch = pending.slice(i, i + MAX_FILES_PER_UPLOAD);
      try {
        setProgress(0);
        await upload.mutateAsync({ files: batch.map((p) => p.file), onProgress: setProgress });
      } catch (err) {
        setErrors([getErrorMessage(err, 'Upload failed.')]);
        setPending((prev) => prev.slice(i)); // keep the batches that did not upload
        return;
      }
    }
    pending.forEach((p) => URL.revokeObjectURL(p.preview));
    setPending([]);
    setProgress(0);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:border-primary-400 hover:bg-primary-50/40',
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300'
        )}
      >
        <UploadCloud className="w-10 h-10 mx-auto text-primary-500 mb-2" />
        <p className="font-medium text-slate-700">Drag & drop photos here, or click to browse</p>
        <p className="text-xs text-slate-500 mt-1">
          JPEG, PNG or WebP · max 10 MB each · {Math.max(remaining, 0)} of {MAX_MEDIA_PER_LISTING} slots left
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          Location and camera metadata are automatically removed from your photos for privacy.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {errors.length > 0 && (
        <ul className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 space-y-1">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {pending.map((p, i) => (
              <div key={p.preview} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                <img src={p.preview} alt={p.file.name} className="w-full h-full object-cover" />
                {!upload.isPending && (
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 hover:bg-white"
                    aria-label={`Remove ${p.file.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {upload.isPending && (
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <Button onClick={handleUpload} isLoading={upload.isPending} leftIcon={<ImagePlus className="w-4 h-4" />}>
            Upload {pending.length} photo{pending.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {media.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Uploaded photos ({media.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {media.map((m) => (
              <div key={m.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-slate-200">
                <img src={m.url} alt={m.caption || 'Listing photo'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {m.is_primary && (
                  <span className="absolute top-1.5 left-1.5 bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    COVER
                  </span>
                )}
                {!disabled && (
                  <div className="absolute inset-x-0 bottom-0 p-1.5 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {!m.is_primary && (
                      <button
                        type="button"
                        onClick={() => setPrimary.mutate(m.id)}
                        className="bg-white/90 rounded p-1 hover:bg-white"
                        title="Set as cover photo"
                      >
                        <Star className="w-4 h-4 text-amber-600" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => window.confirm('Delete this photo permanently?') && remove.mutate(m.id)}
                      className="bg-white/90 rounded p-1 hover:bg-white"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
