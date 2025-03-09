import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type DiaryEntry } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plus, LogOut, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: entries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/entries"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Diary</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Your Entries</h2>
          <Button onClick={() => navigate("/editor")}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-[200px]" />
              </Card>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No entries yet. Start writing!</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EntryCard({ entry }: { entry: DiaryEntry }) {
  const [, navigate] = useLocation();
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/entries/${entry.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
    },
  });

  return (
    <Card className="cursor-pointer group" onClick={() => navigate(`/editor/${entry.id}`)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="line-clamp-1">{entry.title}</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-muted-foreground mb-4">{entry.content}</p>
        <time className="text-sm text-muted-foreground">
          {format(new Date(entry.createdAt), "PPP")}
        </time>
      </CardContent>
    </Card>
  );
}
