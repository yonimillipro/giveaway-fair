import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Upload, Search, X, Mail, AtSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Influencer {
  id: string;
  name: string;
  email: string | null;
  social_handle: string | null;
  profile_image_url: string | null;
  amount_of_followers: number;
  primary_platform: string;
  created_at: string;
}

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Telegram", "Facebook", "Other"];

const formatFollowers = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const AdminInfluencers = () => {
  const isMobile = useIsMobile();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    social_handle: "",
    amount_of_followers: "",
    primary_platform: "",
    profile_image_url: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchInfluencers();
  }, [page]);

  const fetchInfluencers = async () => {
    setLoading(true);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { count } = await supabase
      .from("influencers")
      .select("*", { count: "exact", head: true });
    setTotalCount(count || 0);

    const { data, error } = await supabase
      .from("influencers")
      .select("*")
      .order("amount_of_followers", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Failed to load influencers");
    } else {
      setInfluencers((data as Influencer[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      social_handle: "",
      amount_of_followers: "",
      primary_platform: "",
      profile_image_url: "",
    });
    setSelectedImage(null);
    setEditing(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (influencer: Influencer) => {
    setEditing(influencer);
    setFormData({
      name: influencer.name,
      email: influencer.email || "",
      social_handle: influencer.social_handle || "",
      amount_of_followers: influencer.amount_of_followers.toString(),
      primary_platform: influencer.primary_platform,
      profile_image_url: influencer.profile_image_url || "",
    });
    setSelectedImage(null);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.primary_platform) {
      toast.error("Name and platform are required");
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error("Invalid email format");
      return;
    }

    const followers = parseInt(formData.amount_of_followers) || 0;
    if (followers < 0) {
      toast.error("Followers must be 0 or more");
      return;
    }

    setUploading(true);
    let imageUrl = formData.profile_image_url;

    if (selectedImage) {
      const fileExt = selectedImage.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("influencer-images")
        .upload(fileName, selectedImage);

      if (uploadError) {
        toast.error("Failed to upload image");
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("influencer-images")
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      social_handle: formData.social_handle.trim() || null,
      amount_of_followers: followers,
      primary_platform: formData.primary_platform,
      profile_image_url: imageUrl || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("influencers")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        if (error.message.includes("idx_influencers_email_unique")) {
          toast.error("An influencer with this email already exists");
        } else {
          toast.error("Failed to update influencer");
        }
      } else {
        toast.success("Influencer updated");
      }
    } else {
      const { error } = await supabase.from("influencers").insert(payload);
      if (error) {
        if (error.message.includes("idx_influencers_email_unique")) {
          toast.error("An influencer with this email already exists");
        } else {
          toast.error("Failed to create influencer");
        }
      } else {
        toast.success("Influencer created");
      }
    }

    setUploading(false);
    setDialogOpen(false);
    resetForm();
    fetchInfluencers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete influencer "${name}"?`)) return;
    const { error } = await supabase.from("influencers").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete influencer");
    } else {
      toast.success("Influencer deleted");
      fetchInfluencers();
    }
  };

  const filtered = influencers.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Influencers ({totalCount})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-8 h-8 text-sm"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Button size="sm" className="h-8 text-xs sm:text-sm" onClick={handleOpenCreate}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 sm:pt-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {search ? "No influencers match your search." : "No influencers yet. Click Create to add one."}
            </p>
          ) : isMobile ? (
            <div className="space-y-3">
              {filtered.map((inf) => (
                <Card key={inf.id} className="shadow-card card-hover">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={inf.profile_image_url || undefined} alt={inf.name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {inf.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-sm truncate">{inf.name}</p>
                        {inf.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" /> {inf.email}
                          </p>
                        )}
                        {inf.social_handle && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <AtSign className="h-3 w-3 shrink-0" /> {inf.social_handle}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs font-bold">{formatFollowers(inf.amount_of_followers)}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{inf.primary_platform}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleOpenEdit(inf)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => handleDelete(inf.id, inf.name)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Influencer</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Social</TableHead>
                    <TableHead className="text-xs">Followers</TableHead>
                    <TableHead className="text-xs">Platform</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inf) => (
                    <TableRow key={inf.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={inf.profile_image_url || undefined} alt={inf.name} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {inf.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm truncate max-w-[160px]">{inf.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inf.email || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inf.social_handle || "—"}</TableCell>
                      <TableCell className="text-sm font-semibold">{formatFollowers(inf.amount_of_followers)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{inf.primary_platform}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(inf)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(inf.id, inf.name)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Influencer" : "Create Influencer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image must be under 5MB");
                        return;
                      }
                      setSelectedImage(file);
                      setFormData({ ...formData, profile_image_url: "" });
                    }
                  }}
                  className="flex-1"
                />
                <Upload className="w-4 h-4 text-muted-foreground" />
              </div>
              {selectedImage && (
                <p className="text-xs text-muted-foreground">Selected: {selectedImage.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inf_name">Influencer Name *</Label>
              <Input
                id="inf_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inf_email">Email</Label>
              <Input
                id="inf_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                maxLength={255}
                placeholder="influencer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inf_social">Social Handle</Label>
              <Input
                id="inf_social"
                value={formData.social_handle}
                onChange={(e) => setFormData({ ...formData, social_handle: e.target.value })}
                maxLength={100}
                placeholder="@handle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inf_followers">Amount of Followers *</Label>
              <Input
                id="inf_followers"
                type="number"
                min="0"
                value={formData.amount_of_followers}
                onChange={(e) => setFormData({ ...formData, amount_of_followers: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Primary Platform *</Label>
              <Select
                value={formData.primary_platform}
                onValueChange={(value) => setFormData({ ...formData, primary_platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Saving..." : editing ? "Save Changes" : "Create Influencer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
