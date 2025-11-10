import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, FileImage, FileText, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Upload {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_url: string;
  file_type: string;
  file_name: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

interface UploadHistoryProps {
  userId: string;
  refreshKey?: number;
}

const UploadHistory = ({ userId, refreshKey }: UploadHistoryProps) => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUploads(data || []);
      
      // Generate signed URLs for all uploads
      const urls: Record<string, string> = {};
      for (const upload of data || []) {
        const { data: signedUrl } = await supabase.storage
          .from("uploads")
          .createSignedUrl(upload.file_url, 3600); // 1 hour expiry
        if (signedUrl) {
          urls[upload.id] = signedUrl.signedUrl;
        }
      }
      setFileUrls(urls);
    } catch (error) {
      console.error("Error fetching uploads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();

    const channel = supabase
      .channel("user-uploads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "uploads",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUploads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshKey]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="border-success text-success"><CheckCircle2 className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-destructive text-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const filteredUploads = activeTab === "all" 
    ? uploads 
    : uploads.filter(upload => upload.status === activeTab);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-glow)]">
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
        <CardDescription>View all your uploads and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All ({uploads.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({uploads.filter(u => u.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({uploads.filter(u => u.status === "accepted").length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({uploads.filter(u => u.status === "rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredUploads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {activeTab === "all" ? "No uploads yet" : `No ${activeTab} uploads`}
              </div>
            ) : (
              filteredUploads.map((upload) => (
                <Card key={upload.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {upload.file_type.startsWith("image/") ? (
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileImage className="w-6 h-6 text-primary" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-secondary" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h4 className="font-semibold">{upload.title}</h4>
                          {getStatusBadge(upload.status)}
                        </div>

                        {upload.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {upload.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                          {upload.category && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {upload.category}
                              </Badge>
                            </>
                          )}
                          {fileUrls[upload.id] && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto"
                              onClick={() => window.open(fileUrls[upload.id], "_blank")}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View File
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UploadHistory;
