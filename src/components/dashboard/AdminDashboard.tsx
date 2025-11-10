import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FileImage, FileText, Clock, User as UserIcon, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Upload {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_url: string;
  file_type: string;
  file_name: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  profiles: {
    username: string;
    email: string;
  };
}

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from("uploads")
        .select(`
          *,
          profiles (
            username,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUploads(data || []);
      
      // Generate signed URLs for all uploads
      const urls: Record<string, string> = {};
      for (const upload of data || []) {
        const { data: signedUrl } = await supabase.storage
          .from("uploads")
          .createSignedUrl(upload.file_url, 3600);
        if (signedUrl) {
          urls[upload.id] = signedUrl.signedUrl;
        }
      }
      setFileUrls(urls);
    } catch (error: any) {
      toast({
        title: "Error loading uploads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();

    const channel = supabase
      .channel("uploads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "uploads",
        },
        () => {
          fetchUploads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAccept = async (uploadId: string) => {
    try {
      const { error } = await supabase
        .from("uploads")
        .update({ status: "accepted" })
        .eq("id", uploadId);

      if (error) throw error;

      toast({
        title: "Upload accepted",
        description: "The user will be notified.",
      });
      
      fetchUploads();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (upload: Upload) => {
    try {
      const fileName = upload.file_url.split("/").slice(-2).join("/");
      
      const { error: deleteError } = await supabase.storage
        .from("uploads")
        .remove([fileName]);

      if (deleteError) throw deleteError;

      const { error: dbError } = await supabase
        .from("uploads")
        .delete()
        .eq("id", upload.id);

      if (dbError) throw dbError;

      toast({
        title: "Upload rejected",
        description: "The file has been deleted.",
      });
      
      fetchUploads();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const filteredUploads = uploads.filter((upload) => upload.status === activeTab);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading uploads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-[var(--shadow-glow)]">
        <CardHeader>
          <CardTitle>Review Uploads</CardTitle>
          <CardDescription>
            Accept or reject user uploads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
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
                  No {activeTab} uploads
                </div>
              ) : (
                filteredUploads.map((upload) => (
                  <Card key={upload.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {upload.file_type.startsWith("image/") ? (
                            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileImage className="w-8 h-8 text-primary" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-8 h-8 text-secondary" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{upload.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <UserIcon className="w-3 h-3" />
                                <span>{upload.profiles.username}</span>
                                <span>•</span>
                                <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {getStatusBadge(upload.status)}
                          </div>

                          {upload.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {upload.description}
                            </p>
                          )}

                          {upload.category && (
                            <Badge variant="secondary" className="mb-3">
                              {upload.category}
                            </Badge>
                          )}

                          <div className="flex items-center gap-3">
                            {fileUrls[upload.id] && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(fileUrls[upload.id], "_blank")}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View File
                              </Button>
                            )}

                            {upload.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleAccept(upload.id)}
                                  className="bg-success hover:bg-success/90"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(upload)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
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
    </div>
  );
};

export default AdminDashboard;
