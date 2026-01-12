import { useState, useRef } from "react";
import { productsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  userId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageUpload = ({ userId, images, onImagesChange, maxImages = 5 }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const validFiles: File[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 5MB allowed.`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        const uploadedUrls = await productsApi.uploadImages(validFiles);
        onImagesChange([...images, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} image(s) uploaded`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    onImagesChange(images.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(url)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-medium">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer
            hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-200
            ${isUploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Click to upload images
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG up to 5MB - Max {maxImages} images
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {images.length === 0 && !isUploading && (
        <p className="text-xs text-muted-foreground text-center">
          First image will be used as the cover photo
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
