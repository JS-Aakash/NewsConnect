import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Users, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-[var(--shadow-glow)] mb-4">
              <Upload className="w-10 h-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              MediaFlow
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your upload approval process. Upload, review, and manage files with ease.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Uploads</h3>
              <p className="text-muted-foreground">
                Upload images and PDFs with titles, descriptions, and categories in seconds.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-border">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Reviews</h3>
              <p className="text-muted-foreground">
                Admins can instantly accept or reject uploads with a single click.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-muted-foreground">
                Get instant notifications when your uploads are reviewed and approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
