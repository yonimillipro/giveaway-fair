import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  bucket: string;
  folder?: string;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  label?: string;
  urlLabel?: string;
}

export const ImageUpload = ({
  bucket,
  folder = "",
  currentUrl,
  onUrlChange,
  label = "Image",
  urlLabel = "Image URL (Optional)",
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setUploadedUrl(publicUrl);
      onUrlChange(publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setUploadedUrl(null);
    onUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayImage = preview || uploadedUrl || (currentUrl && !uploadedUrl ? currentUrl : null);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Upload button and preview */}
      <div className="flex flex-col gap-3">
        {displayImage ? (
          <div className="relative w-full">
            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <img
                src={displayImage}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload image
            </p>
            <p className="text-xs text-muted-foreground/70">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!displayImage && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
        )}
      </div>

      {/* Optional URL input - only show if no uploaded image */}
      {!uploadedUrl && !preview && (
        <div className="space-y-2">
          <Label htmlFor="image-url" className="text-xs text-muted-foreground">
            {urlLabel}
          </Label>
          <Input
            id="image-url"
            placeholder="https://example.com/image.jpg"
            value={currentUrl}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
