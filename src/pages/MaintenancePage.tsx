import { useEffect, useState } from "react";
import { Wrench, Clock, AlertCircle } from "lucide-react";

const MaintenancePage = () => {
  const [message, setMessage] = useState("We are currently performing maintenance. Please check back soon.");

  useEffect(() => {
    // Try to fetch the maintenance message from API
    const fetchMessage = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/settings/public/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.maintenance_message) {
            setMessage(data.maintenance_message);
          }
        }
      } catch (error) {
        // Use default message if API call fails
        console.error('Failed to fetch maintenance message:', error);
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container max-w-2xl px-4">
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-primary/10 rounded-full p-8">
                <Wrench className="w-16 h-16 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Under Maintenance
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <p className="text-lg">We'll be back shortly</p>
            </div>
          </div>

          {/* Message */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground text-left">
                {message}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Thank you for your patience.</p>
            <p>If you have urgent questions, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;

