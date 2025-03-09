import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type DiaryEntry, insertEntrySchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Editor() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: entry, isLoading: isLoadingEntry } = useQuery<DiaryEntry>({
    queryKey: [`/api/entries/${id}`],
    enabled: !!id,
  });

  const form = useForm({
    resolver: zodResolver(insertEntrySchema),
    defaultValues: {
      title: "",
      content: "",
    },
    values: entry,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/entries", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      navigate("/");
      toast({
        title: "Entry saved",
        description: "Your diary entry has been saved successfully.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/entries/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries", `/api/entries/${id}`] });
      navigate("/");
      toast({
        title: "Entry updated",
        description: "Your diary entry has been updated successfully.",
      });
    },
  });

  const onSubmit = (data: { title: string; content: string }) => {
    if (id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (id && isLoadingEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Title"
                      className="text-2xl font-bold border-none shadow-none focus-visible:ring-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Write your thoughts..."
                      className="min-h-[500px] resize-none border-none shadow-none focus-visible:ring-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </main>
    </div>
  );
}
