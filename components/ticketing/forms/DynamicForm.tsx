// @/components/StaticTicketForm.tsx
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

interface StaticTicketFormProps {
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

export function StaticTicketForm({ onClose, onSubmitSuccess }: StaticTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: "",
    email: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Simple Validation check
    if (!formData.title || !formData.email || !formData.description) {
      toast.error("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);

    // 2. Prepare exact payload matching your layout
    const payload = {
      type: "static_support_ticket",
      values: formData,
    };

    // 3. HTTP POST Submission
    try {
      const response = await fetch("https://auto.fortmont.me/webhook-test/for-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with code ${response.status}`);
      }

      toast.success("Ticket submitted successfully");
      
      if (onSubmitSuccess) onSubmitSuccess();
      onClose(); // Automatically close modal/component on success
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit ticket", {
        description: error instanceof Error ? error.message : "An unknown network error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md w-full mx-auto p-4 bg-background border rounded-lg">
      {/* Informational Callout */}
      <div className="flex gap-3 rounded-md border border-border bg-muted p-4">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Create a New Ticket</p>
          <p className="text-xs text-muted-foreground">Please fill out this form to request assistance.</p>
        </div>
      </div>

      {/* Ticket Title (Text input) */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Ticket Title<span className="ml-1 text-muted-foreground">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="Brief summary of your request"
          value={formData.title}
          onChange={handleChange}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Email Address (Email input) */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Contact Email<span className="ml-1 text-muted-foreground">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Description (Textarea) */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Detailed Description<span className="ml-1 text-muted-foreground">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Tell us more about how we can help..."
          value={formData.description}
          onChange={handleChange}
          rows={4}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Form Action Buttons */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit ticket"
          )}
        </Button>
      </div>
    </form>
  );
}