import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileImage, FileText } from "lucide-react";
import UploadHistory from "./UploadHistory";
import { z } from "zod";

interface UserDashboardProps {
  user: User;
}

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  category: z.string().max(50, "Category must be less than 50 characters").optional(),
});

const UserDashboard = ({ user }: UserDashboardProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (
        fileType.startsWith("image/") ||
        fileType === "application/pdf"
      ) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image (PNG, JPG, etc.) or a PDF file.",
          variant: "destructive",
        });
        e.target.value = "";
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const validated = uploadSchema.parse(formData);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("uploads").insert({
        user_id: user.id,
        title: validated.title,
        description: validated.description || null,
        category: validated.category || null,
        file_url: fileName,
        file_type: file.type,
        file_name: file.name,
      });

      if (dbError) throw dbError;

      toast({
        title: "Upload successful!",
        description: "Your file has been submitted for review.",
      });

      setFile(null);
      setFormData({ title: "", description: "", category: "" });
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-[var(--shadow-glow)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload New File
          </CardTitle>
          <CardDescription>
            Upload an image or PDF for admin review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">File (Image or PDF)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  required
                />
                {file && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {file.type.startsWith("image/") ? (
                      <FileImage className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-[150px]">{file.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your upload"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="e.g., Invoice, Report, Photo"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                maxLength={50}
              />
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <UploadHistory userId={user.id} refreshKey={refreshKey} />
    </div>
  );
};

export default UserDashboard;
