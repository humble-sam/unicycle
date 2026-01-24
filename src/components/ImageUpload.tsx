import { useState, useRef } from "react";
import { productsApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  userId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const ImageUpload = ({ userId, images, onImagesChange, maxImages = 5 }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to upload with retry
  const uploadWithRetry = async (files: File[], retryCount = 0): Promise<string[]> => {
    try {
      return await productsApi.uploadImages(files);
    } catch (error: any) {
      if (retryCount < MAX_RETRIES) {
        setUploadProgress(`Retrying... (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return uploadWithRetry(files, retryCount + 1);
      }
      throw error;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if user is authenticated
    if (!authApi.isAuthenticated()) {
      toast.error("Please sign in to upload images");
      return;
    }

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);
    setUploadProgress("Validating files...");
    setFailedFiles([]);

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
        setUploadProgress(`Uploading ${validFiles.length} image(s)...`);
        const uploadedUrls = await uploadWithRetry(validFiles);
        onImagesChange([...images, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
        setUploadProgress("");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Provide more specific error messages
      if (error.message?.includes("401") || error.message?.includes("token") || error.message?.includes("auth")) {
        toast.error("Session expired. Please sign in again.");
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.");
        // Save failed files for retry
        setFailedFiles(Array.from(files || []));
      } else if (error.message?.includes("size") || error.message?.includes("large")) {
        toast.error("File too large. Please use images under 5MB.");
      } else {
        toast.error(error.message || "Failed to upload images. Please try again.");
      }
      setUploadProgress("");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRetryFailed = async () => {
    if (failedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress("Retrying upload...");

    try {
      const uploadedUrls = await uploadWithRetry(failedFiles);
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
      setFailedFiles([]);
      setUploadProgress("");
    } catch (error: any) {
      toast.error("Upload failed again. Please try with smaller images.");
      setUploadProgress("");
    } finally {
      setIsUploading(false);
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
                <p className="text-sm text-muted-foreground">
                  {uploadProgress || "Uploading..."}
                </p>
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

      {/* Retry button for failed uploads */}
      {failedFiles.length > 0 && !isUploading && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-destructive">
              {failedFiles.length} image(s) failed to upload
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetryFailed}
              className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {images.length === 0 && !isUploading && failedFiles.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          First image will be used as the cover photo
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
