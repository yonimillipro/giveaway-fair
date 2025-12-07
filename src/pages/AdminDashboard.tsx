import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LogOut,
  Users,
  Building2,
  Gift,
  Trophy,
  Plus,
  UserPlus,
  Upload,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface CompanyUser {
  id: string;
  email: string;
  full_name: string | null;
}

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  company_id: string;
  company_name: string;
  created_at: string;
  entries_count: number;
}

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalGiveaways: number;
  totalWinners: number;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<CompanyUser[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalGiveaways: 0,
    totalWinners: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isGiveawayDialogOpen, setIsGiveawayDialogOpen] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
  
  // User edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    full_name: "",
    role: "",
  });

  const [companyFormData, setCompanyFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    logo_url: "",
  });
  const [selectedCompanyLogo, setSelectedCompanyLogo] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Multiple images for giveaways
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [giveawayFormData, setGiveawayFormData] = useState({
    company_id: "",
    title: "",
    description: "",
    image_url: "",
    prize_value: "",
    end_date: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const resetGiveawayForm = () => {
    setGiveawayFormData({
      company_id: "",
      title: "",
      description: "",
      image_url: "",
      prize_value: "",
      end_date: "",
    });
    setSelectedImage(null);
    setEditingGiveaway(null);
  };

  useEffect(() => {
    const loadData = async () => {
      // 1. Fetch companies first, as it's a dependency for fetching giveaways
      const companyProfiles = await fetchCompanies();
      await fetchData();
      await fetchGiveaways(companyProfiles);
      setLoading(false);
    };
    loadData();
  }, []);

  // Sync state with form when editingGiveaway changes
  useEffect(() => {
    if (editingGiveaway) {
      // Format the date for the datetime-local input
      const formattedEndDate = format(
        new Date(editingGiveaway.end_date),
        "yyyy-MM-dd'T'HH:mm"
      );

      setGiveawayFormData({
        company_id: editingGiveaway.company_id,
        title: editingGiveaway.title,
        description: editingGiveaway.description,
        image_url: editingGiveaway.image_url || "",
        prize_value: editingGiveaway.prize_value?.toString() || "",
        end_date: formattedEndDate,
      });
      setIsGiveawayDialogOpen(true);
    } else {
      resetGiveawayForm();
    }
  }, [editingGiveaway]);

  const fetchData = async () => {
    try {
      // ... (fetchData logic remains the same)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      const usersData = (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || "N/A",
        role: roleMap.get(profile.id) || "user",
        created_at: profile.created_at,
      }));

      setUsers(usersData);

      const userCount = usersData.filter((u) => u.role === "user").length;
      const companyCount = usersData.filter((u) => u.role === "company").length;

      const { count: winnerCount } = await supabase
        .from("winners")
        .select("*", { count: "exact", head: true });

      setStats((prev) => ({
        ...prev,
        totalUsers: userCount,
        totalCompanies: companyCount,
        totalWinners: winnerCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load admin data");
    }
  };

  const fetchCompanies = async (): Promise<CompanyUser[]> => {
    // ... (fetchCompanies logic remains the same)
    try {
      const { data: companyRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "company");

      if (!companyRoles) return [];

      const companyIds = companyRoles.map((r) => r.user_id);

      if (companyIds.length === 0) {
        setCompanies([]);
        return [];
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", companyIds);

      const companyData = profiles || [];
      setCompanies(companyData);
      return companyData;
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
  };

  const fetchGiveaways = async (companyProfiles: CompanyUser[]) => {
    // ... (fetchGiveaways logic remains the same)
    try {
      const companyMap = new Map(
        (companyProfiles || []).map((p) => [p.id, p.full_name || "N/A"])
      );

      const { data: giveawaysData, error } = await supabase
        .from("giveaways")
        .select(
          `id, title, description, image_url, prize_value, end_date, created_at, company_id`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const giveawaysWithDetails = await Promise.all(
        (giveawaysData || []).map(async (g) => {
          const { count } = await supabase
            .from("giveaway_entries")
            .select("*", { count: "exact", head: true })
            .eq("giveaway_id", g.id);

          return {
            id: g.id,
            title: g.title,
            description: g.description || "",
            image_url: g.image_url || null,
            prize_value: g.prize_value,
            end_date: g.end_date,
            company_id: g.company_id,
            company_name: companyMap.get(g.company_id) || "Unknown Company",
            created_at: g.created_at,
            entries_count: count || 0,
          };
        })
      );

      setGiveaways(giveawaysWithDetails);
      setStats((prev) => ({
        ...prev,
        totalGiveaways: giveawaysData.length,
      }));
    } catch (error) {
      console.error("Error fetching giveaways:", error);
      toast.error("Failed to load giveaways");
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploadingLogo(true);
      
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      // Upload company logo if selected
      let logoUrl = companyFormData.logo_url;
      if (selectedCompanyLogo) {
        const uploadedUrl = await handleImageUpload(selectedCompanyLogo);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-company`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: companyFormData.email,
            password: companyFormData.password,
            full_name: companyFormData.full_name,
            logo_url: logoUrl,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create company account");
      }

      toast.success("Company account created successfully!");
      setIsCompanyDialogOpen(false);
      setCompanyFormData({ email: "", password: "", full_name: "", logo_url: "" });
      setSelectedCompanyLogo(null);
      const companyProfiles = await fetchCompanies();
      fetchData();
      fetchGiveaways(companyProfiles);
    } catch (error: any) {
      toast.error(error.message || "Failed to create company account");
      console.error(error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    // ... (handleImageUpload logic remains the same)
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("giveaway-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("giveaway-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  // UPDATED: Combined Create (Insert) and Update logic with multiple images
  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate company selection
    if (!giveawayFormData.company_id) {
      toast.error("Please select a company");
      return;
    }

    try {
      setUploadingImage(true);

      let imageUrl = giveawayFormData.image_url;
      const uploadedImageUrls: string[] = [];

      // If multiple files are selected, upload all of them
      if (selectedImages.length > 0) {
        for (const file of selectedImages) {
          const uploadedUrl = await handleImageUpload(file);
          if (uploadedUrl) {
            uploadedImageUrls.push(uploadedUrl);
          }
        }
        // Use first image as the main image_url
        if (uploadedImageUrls.length > 0) {
          imageUrl = uploadedImageUrls[0];
        }
      } else if (selectedImage) {
        // Fallback to single image upload
        const uploadedUrl = await handleImageUpload(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          uploadedImageUrls.push(uploadedUrl);
        }
      }

      const payload = {
        company_id: giveawayFormData.company_id,
        title: giveawayFormData.title,
        description: giveawayFormData.description,
        image_url: imageUrl || null,
        prize_value: giveawayFormData.prize_value
          ? parseFloat(giveawayFormData.prize_value)
          : null,
        end_date: giveawayFormData.end_date,
      };

      let giveawayId: string;

      if (editingGiveaway) {
        // Update Giveaway (U)
        const { error } = await supabase
          .from("giveaways")
          .update(payload)
          .eq("id", editingGiveaway.id);

        if (error) throw error;
        giveawayId = editingGiveaway.id;
        toast.success(`Giveaway "${payload.title}" updated successfully!`);
      } else {
        // Create Giveaway (C)
        const { data, error } = await supabase
          .from("giveaways")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        giveawayId = data.id;
        toast.success(`Giveaway "${payload.title}" created successfully!`);
      }

      // Insert multiple images into giveaway_images table
      if (uploadedImageUrls.length > 0) {
        // If editing, delete existing images first
        if (editingGiveaway) {
          await supabase
            .from("giveaway_images")
            .delete()
            .eq("giveaway_id", giveawayId);
        }

        // Insert new images
        const imageInserts = uploadedImageUrls.map((url, index) => ({
          giveaway_id: giveawayId,
          image_url: url,
          display_order: index,
        }));

        await supabase.from("giveaway_images").insert(imageInserts);
      }

      setIsGiveawayDialogOpen(false);
      resetGiveawayForm();
      setSelectedImages([]);
      const companyProfiles = await fetchCompanies();
      fetchData();
      fetchGiveaways(companyProfiles);
    } catch (error) {
      toast.error("Failed to save giveaway");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  // NEW: Handle Giveaway Deletion (D)
  const handleDeleteGiveaway = async (giveawayId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the giveaway: "${title}"? This action cannot be undone and will delete all associated entries and winners.`
      )
    )
      return;

    try {
      // Assuming Admin role can delete, or RLS is configured to allow this for admins.
      // Deletion of related entries/winners should ideally be handled by cascade delete in the database schema.
      const { error } = await supabase
        .from("giveaways")
        .delete()
        .eq("id", giveawayId);

      if (error) throw error;

      toast.success(`Giveaway "${title}" deleted successfully!`);

      // Refresh data
      const companyProfiles = await fetchCompanies();
      fetchData();
      fetchGiveaways(companyProfiles);
    } catch (error) {
      console.error("Error deleting giveaway:", error);
      toast.error("Failed to delete giveaway. Check RLS policies.");
    }
  };

  // NEW: Function to open the dialog for editing
  const handleEditGiveaway = (giveaway: Giveaway) => {
    setEditingGiveaway(giveaway);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      toast.success("User deleted successfully!");
      const companyProfiles = await fetchCompanies();
      fetchData();
      fetchGiveaways(companyProfiles);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      full_name: user.full_name || "",
      role: user.role,
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: editingUser.id,
            full_name: userFormData.full_name,
            role: userFormData.role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user");
      }

      toast.success("User updated successfully!");
      setIsUserDialogOpen(false);
      setEditingUser(null);
      const companyProfiles = await fetchCompanies();
      fetchData();
      fetchGiveaways(companyProfiles);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog
            open={isCompanyDialogOpen}
            onOpenChange={setIsCompanyDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Company Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Company Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_email">Email *</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={companyFormData.email}
                    onChange={(e) =>
                      setCompanyFormData({
                        ...companyFormData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_password">Password *</Label>
                  <Input
                    id="company_password"
                    type="password"
                    value={companyFormData.password}
                    onChange={(e) =>
                      setCompanyFormData({
                        ...companyFormData,
                        password: e.target.value,
                      })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={companyFormData.full_name}
                    onChange={(e) =>
                      setCompanyFormData({
                        ...companyFormData,
                        full_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_logo">Company Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="company_logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedCompanyLogo(file);
                        }
                      }}
                      className="flex-1"
                    />
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {selectedCompanyLogo && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedCompanyLogo.name}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={uploadingLogo}>
                  {uploadingLogo ? "Creating..." : "Create Company"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isGiveawayDialogOpen}
            onOpenChange={(open) => {
              setIsGiveawayDialogOpen(open);
              if (!open) {
                resetGiveawayForm(); // Clear form when modal is closed
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                onClick={() => setEditingGiveaway(null)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Giveaway
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingGiveaway ? "Edit Giveaway" : "Create New Giveaway"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveGiveaway} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_select">Select Company *</Label>
                  <Select
                    value={giveawayFormData.company_id}
                    onValueChange={(value) =>
                      setGiveawayFormData({
                        ...giveawayFormData,
                        company_id: value,
                      })
                    }
                    required
                    // Disable company select when editing to prevent errors
                    disabled={!!editingGiveaway}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No companies available
                        </div>
                      ) : (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.full_name || company.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {editingGiveaway && (
                    <p className="text-xs text-muted-foreground">
                      * Company cannot be changed while editing.
                    </p>
                  )}
                </div>
                {/* ... (Other form fields like title, description, image, prize value, end date remain the same) ... */}
                <div className="space-y-2">
                  <Label htmlFor="giveaway_title">Title *</Label>
                  <Input
                    id="giveaway_title"
                    value={giveawayFormData.title}
                    onChange={(e) =>
                      setGiveawayFormData({
                        ...giveawayFormData,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_description">Description *</Label>
                  <Textarea
                    id="giveaway_description"
                    value={giveawayFormData.description}
                    onChange={(e) =>
                      setGiveawayFormData({
                        ...giveawayFormData,
                        description: e.target.value,
                      })
                    }
                    required
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_images">Images (First image will be the cover)</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="giveaway_image_files"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            setSelectedImages(files);
                            setSelectedImage(null);
                            setGiveawayFormData({
                              ...giveawayFormData,
                              image_url: "",
                            });
                          }
                        }}
                        className="flex-1"
                      />
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      or use a single URL
                    </div>
                    <Input
                      id="giveaway_image_url"
                      type="url"
                      value={giveawayFormData.image_url}
                      onChange={(e) => {
                        setGiveawayFormData({
                          ...giveawayFormData,
                          image_url: e.target.value,
                        });
                        setSelectedImages([]);
                        setSelectedImage(null);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {selectedImages.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Selected {selectedImages.length} image(s):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedImages.map((file, index) => (
                          <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                            {index === 0 && <span className="text-primary font-medium">(Cover) </span>}
                            {file.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!selectedImages.length && !selectedImage &&
                    giveawayFormData.image_url &&
                    editingGiveaway && (
                      <p className="text-sm text-muted-foreground">
                        Current URL:{" "}
                        {giveawayFormData.image_url.substring(0, 50)}...
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_prize">Prize Value ($)</Label>
                  <Input
                    id="giveaway_prize"
                    type="number"
                    step="0.01"
                    value={giveawayFormData.prize_value}
                    onChange={(e) =>
                      setGiveawayFormData({
                        ...giveawayFormData,
                        prize_value: e.target.value,
                      })
                    }
                    placeholder="100.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_end">End Date *</Label>
                  <Input
                    id="giveaway_end"
                    type="datetime-local"
                    value={giveawayFormData.end_date}
                    onChange={(e) =>
                      setGiveawayFormData({
                        ...giveawayFormData,
                        end_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadingImage}
                >
                  {uploadingImage
                    ? "Uploading..."
                    : editingGiveaway
                    ? "Save Changes"
                    : "Create Giveaway"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards ... (remains the same) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Companies
              </CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Giveaways
              </CardTitle>
              <Gift className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGiveaways}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Winners
              </CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWinners}</div>
            </CardContent>
          </Card>
        </div>
        {/* -------------------------------------------------------------------------- */}

        {/* Giveaways Table (CRUD - R, U, D) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Giveaways</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">
                Loading giveaways...
              </p>
            ) : giveaways.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No giveaways found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead>Prize Value</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giveaways.map((giveaway) => (
                      <TableRow key={giveaway.id}>
                        <TableCell className="font-medium">
                          {giveaway.title}
                        </TableCell>
                        <TableCell>{giveaway.company_name}</TableCell>
                        <TableCell>{giveaway.entries_count}</TableCell>
                        <TableCell>
                          {giveaway.prize_value
                            ? `$${giveaway.prize_value.toFixed(2)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(giveaway.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(giveaway.created_at).toLocaleDateString()}
                        </TableCell>
                        {/* UPDATED Actions Cell */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGiveaway(giveaway)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDeleteGiveaway(
                                  giveaway.id,
                                  giveaway.title
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* -------------------------------------------------------------------------- */}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">
                Loading users...
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : user.role === "company" ? "outline" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {user.role !== "admin" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  value={editingUser?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_full_name">Full Name</Label>
                <Input
                  id="user_full_name"
                  value={userFormData.full_name}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_role">Role</Label>
                <Select
                  value={userFormData.role}
                  onValueChange={(value) =>
                    setUserFormData({ ...userFormData, role: value })
                  }
                  disabled={editingUser?.role === "admin"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {editingUser?.role === "admin" && (
                  <p className="text-xs text-muted-foreground">Admin roles cannot be changed</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;

//EDIT/VIEW
// import { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import {
//   LogOut,
//   Users,
//   Building2,
//   Gift,
//   Trophy,
//   Plus,
//   UserPlus,
//   Upload,
// } from "lucide-react";

// interface User {
//   id: string;
//   email: string;
//   full_name: string;
//   role: string;
//   created_at: string;
// }

// interface CompanyUser {
//   id: string;
//   email: string;
//   full_name: string | null;
// }

// interface Giveaway {
//   id: string;
//   title: string;
//   prize_value: number | null;
//   end_date: string;
//   company_id: string;
//   company_name: string;
//   created_at: string;
//   entries_count: number;
// }

// interface Stats {
//   totalUsers: number;
//   totalCompanies: number;
//   totalGiveaways: number;
//   totalWinners: number;
// }

// const AdminDashboard = () => {
//   const { signOut } = useAuth();
//   const [users, setUsers] = useState<User[]>([]);
//   const [companies, setCompanies] = useState<CompanyUser[]>([]);
//   const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     totalUsers: 0,
//     totalCompanies: 0,
//     totalGiveaways: 0,
//     totalWinners: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
//   const [isGiveawayDialogOpen, setIsGiveawayDialogOpen] = useState(false);
//   const [companyFormData, setCompanyFormData] = useState({
//     email: "",
//     password: "",
//     full_name: "",
//   });
//   const [giveawayFormData, setGiveawayFormData] = useState({
//     company_id: "",
//     title: "",
//     description: "",
//     image_url: "",
//     prize_value: "",
//     end_date: "",
//   });
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [uploadingImage, setUploadingImage] = useState(false);

//   useEffect(() => {
//     const loadData = async () => {
//       // 1. Fetch companies first, as it's a dependency for fetching giveaways
//       const companyProfiles = await fetchCompanies();
//       await fetchData();
//       await fetchGiveaways(companyProfiles);
//       setLoading(false);
//     };
//     loadData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       // Fetch all profiles
//       const { data: profiles, error: profilesError } = await supabase
//         .from("profiles")
//         .select("id, email, full_name, created_at")
//         .order("created_at", { ascending: false });

//       if (profilesError) throw profilesError;

//       // Fetch all user roles
//       const { data: roles, error: rolesError } = await supabase
//         .from("user_roles")
//         .select("user_id, role");

//       if (rolesError) throw rolesError;

//       // Create a map of user_id to role
//       const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

//       // Combine profiles with roles
//       const usersData = (profiles || []).map((profile: any) => ({
//         id: profile.id,
//         email: profile.email,
//         full_name: profile.full_name || "N/A",
//         role: roleMap.get(profile.id) || "user",
//         created_at: profile.created_at,
//       }));

//       setUsers(usersData);

//       // Calculate stats (giveaway count is updated in fetchGiveaways)
//       const userCount = usersData.filter((u) => u.role === "user").length;
//       const companyCount = usersData.filter((u) => u.role === "company").length;

//       const { count: winnerCount } = await supabase
//         .from("winners")
//         .select("*", { count: "exact", head: true });

//       setStats((prev) => ({
//         ...prev,
//         totalUsers: userCount,
//         totalCompanies: companyCount,
//         totalWinners: winnerCount || 0,
//       }));
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       toast.error("Failed to load admin data");
//     }
//   };

//   // UPDATED: Now returns the company data for use in fetchGiveaways
//   const fetchCompanies = async (): Promise<CompanyUser[]> => {
//     try {
//       const { data: companyRoles } = await supabase
//         .from("user_roles")
//         .select("user_id")
//         .eq("role", "company");

//       if (!companyRoles) return [];

//       const companyIds = companyRoles.map((r) => r.user_id);

//       if (companyIds.length === 0) {
//         setCompanies([]);
//         return [];
//       }

//       const { data: profiles } = await supabase
//         .from("profiles")
//         .select("id, email, full_name")
//         .in("id", companyIds);

//       const companyData = profiles || [];
//       setCompanies(companyData);
//       return companyData;
//     } catch (error) {
//       console.error("Error fetching companies:", error);
//       return [];
//     }
//   };

//   // UPDATED: Now accepts companyProfiles and avoids the RLS-sensitive JOIN
//   const fetchGiveaways = async (companyProfiles: CompanyUser[]) => {
//     try {
//       // Create a map for quick company name lookup
//       const companyMap = new Map(
//         (companyProfiles || []).map((p) => [p.id, p.full_name || "N/A"])
//       );

//       // Fetch all giveaways using a simple select
//       const { data: giveawaysData, error } = await supabase
//         .from("giveaways")
//         .select(`id, title, prize_value, end_date, created_at, company_id`)
//         .order("created_at", { ascending: false });

//       if (error) throw error;

//       // Fetch entry counts and map company names in parallel (like UserDashboard.tsx)
//       const giveawaysWithDetails = await Promise.all(
//         (giveawaysData || []).map(async (g) => {
//           const { count } = await supabase
//             .from("giveaway_entries")
//             .select("*", { count: "exact", head: true })
//             .eq("giveaway_id", g.id);

//           return {
//             id: g.id,
//             title: g.title,
//             prize_value: g.prize_value,
//             end_date: g.end_date,
//             company_id: g.company_id,
//             company_name: companyMap.get(g.company_id) || "Unknown Company", // Look up name
//             created_at: g.created_at,
//             entries_count: count || 0,
//           };
//         })
//       );

//       setGiveaways(giveawaysWithDetails);
//       setStats((prev) => ({
//         ...prev,
//         totalGiveaways: giveawaysData.length,
//       }));
//     } catch (error) {
//       console.error("Error fetching giveaways:", error);
//       toast.error("Failed to load giveaways");
//     }
//   };

//   // ... (handleCreateCompany, handleImageUpload, handleCreateGiveaway, handleDeleteUser remain the same)
//   const handleCreateCompany = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session) {
//         toast.error("You must be logged in");
//         return;
//       }

//       // Call Edge Function to create company with service role
//       const response = await fetch(
//         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-company`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${session.access_token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             email: companyFormData.email,
//             password: companyFormData.password,
//             full_name: companyFormData.full_name,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to create company account");
//       }

//       toast.success("Company account created successfully!");
//       setIsCompanyDialogOpen(false);
//       setCompanyFormData({ email: "", password: "", full_name: "" });
//       // Reload all data after creation
//       const companyProfiles = await fetchCompanies();
//       fetchData();
//       fetchGiveaways(companyProfiles);
//     } catch (error: any) {
//       toast.error(error.message || "Failed to create company account");
//       console.error(error);
//     }
//   };

//   const handleImageUpload = async (file: File): Promise<string | null> => {
//     try {
//       const fileExt = file.name.split(".").pop();
//       const fileName = `${Math.random()
//         .toString(36)
//         .substring(2)}-${Date.now()}.${fileExt}`;
//       const filePath = fileName;

//       const { error: uploadError } = await supabase.storage
//         .from("giveaway-images")
//         .upload(filePath, file);

//       if (uploadError) throw uploadError;

//       const {
//         data: { publicUrl },
//       } = supabase.storage.from("giveaway-images").getPublicUrl(filePath);

//       return publicUrl;
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       toast.error("Failed to upload image");
//       return null;
//     }
//   };

//   const handleCreateGiveaway = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate company selection
//     if (!giveawayFormData.company_id) {
//       toast.error("Please select a company");
//       return;
//     }

//     try {
//       setUploadingImage(true);

//       let imageUrl = giveawayFormData.image_url;

//       // If a file is selected, upload it
//       if (selectedImage) {
//         const uploadedUrl = await handleImageUpload(selectedImage);
//         if (uploadedUrl) {
//           imageUrl = uploadedUrl;
//         }
//       }

//       const { error } = await supabase.from("giveaways").insert({
//         company_id: giveawayFormData.company_id,
//         title: giveawayFormData.title,
//         description: giveawayFormData.description,
//         image_url: imageUrl || null,
//         prize_value: giveawayFormData.prize_value
//           ? parseFloat(giveawayFormData.prize_value)
//           : null,
//         end_date: giveawayFormData.end_date,
//       });

//       if (error) throw error;

//       toast.success("Giveaway created successfully!");
//       setIsGiveawayDialogOpen(false);
//       setGiveawayFormData({
//         company_id: "",
//         title: "",
//         description: "",
//         image_url: "",
//         prize_value: "",
//         end_date: "",
//       });
//       setSelectedImage(null);
//       // Reload all data after creation
//       const companyProfiles = await fetchCompanies();
//       fetchData();
//       fetchGiveaways(companyProfiles); // Refresh giveaways list
//     } catch (error) {
//       toast.error("Failed to create giveaway");
//       console.error(error);
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (!confirm("Are you sure you want to delete this user?")) return;

//     try {
//       // Note: In a production app, you'd want to use an Edge Function for this
//       // as deleting auth users requires service role key
//       toast.error("User deletion requires admin privileges via backend");
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       toast.error("Failed to delete user");
//     }
//   };
//   // ... (Rest of the component remains the same)

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//             <Button variant="outline" onClick={signOut}>
//               <LogOut className="w-4 h-4 mr-2" />
//               Sign Out
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         {/* Action Buttons */}
//         <div className="flex gap-4 mb-8">
//           <Dialog
//             open={isCompanyDialogOpen}
//             onOpenChange={setIsCompanyDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button>
//                 <UserPlus className="w-4 h-4 mr-2" />
//                 Create Company Account
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Create Company Account</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateCompany} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_email">Email *</Label>
//                   <Input
//                     id="company_email"
//                     type="email"
//                     value={companyFormData.email}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         email: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_password">Password *</Label>
//                   <Input
//                     id="company_password"
//                     type="password"
//                     value={companyFormData.password}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         password: e.target.value,
//                       })
//                     }
//                     required
//                     minLength={6}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_name">Company Name *</Label>
//                   <Input
//                     id="company_name"
//                     value={companyFormData.full_name}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         full_name: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button type="submit" className="w-full">
//                   Create Company
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>

//           <Dialog
//             open={isGiveawayDialogOpen}
//             onOpenChange={setIsGiveawayDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button variant="secondary">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create Giveaway
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Create Giveaway for Company</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateGiveaway} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_select">Select Company *</Label>
//                   <Select
//                     value={giveawayFormData.company_id}
//                     onValueChange={(value) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         company_id: value,
//                       })
//                     }
//                     required
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose a company" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {companies.length === 0 ? (
//                         <div className="p-2 text-sm text-muted-foreground">
//                           No companies available
//                         </div>
//                       ) : (
//                         companies.map((company) => (
//                           <SelectItem key={company.id} value={company.id}>
//                             {company.full_name || company.email}
//                           </SelectItem>
//                         ))
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_title">Title *</Label>
//                   <Input
//                     id="giveaway_title"
//                     value={giveawayFormData.title}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         title: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_description">Description *</Label>
//                   <Textarea
//                     id="giveaway_description"
//                     value={giveawayFormData.description}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         description: e.target.value,
//                       })
//                     }
//                     required
//                     rows={4}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_image">Image</Label>
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <Input
//                         id="giveaway_image_file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0];
//                           if (file) {
//                             setSelectedImage(file);
//                             setGiveawayFormData({
//                               ...giveawayFormData,
//                               image_url: "",
//                             });
//                           }
//                         }}
//                         className="flex-1"
//                       />
//                       <Upload className="w-4 h-4 text-muted-foreground" />
//                     </div>
//                     <div className="text-center text-sm text-muted-foreground">
//                       or
//                     </div>
//                     <Input
//                       id="giveaway_image_url"
//                       type="url"
//                       value={giveawayFormData.image_url}
//                       onChange={(e) => {
//                         setGiveawayFormData({
//                           ...giveawayFormData,
//                           image_url: e.target.value,
//                         });
//                         setSelectedImage(null);
//                       }}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                   {selectedImage && (
//                     <p className="text-sm text-muted-foreground">
//                       Selected: {selectedImage.name}
//                     </p>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_prize">Prize Value ($)</Label>
//                   <Input
//                     id="giveaway_prize"
//                     type="number"
//                     step="0.01"
//                     value={giveawayFormData.prize_value}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         prize_value: e.target.value,
//                       })
//                     }
//                     placeholder="100.00"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_end">End Date *</Label>
//                   <Input
//                     id="giveaway_end"
//                     type="datetime-local"
//                     value={giveawayFormData.end_date}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         end_date: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   className="w-full"
//                   disabled={uploadingImage}
//                 >
//                   {uploadingImage ? "Uploading..." : "Create Giveaway"}
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//               <Users className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalUsers}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Companies
//               </CardTitle>
//               <Building2 className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalCompanies}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Giveaways
//               </CardTitle>
//               <Gift className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalGiveaways}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Winners
//               </CardTitle>
//               <Trophy className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalWinners}</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Giveaways Table - NEW SECTION */}
//         <Card className="mb-8">
//           <CardHeader>
//             <CardTitle>All Giveaways</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <p className="text-center text-muted-foreground py-4">
//                 Loading giveaways...
//               </p>
//             ) : giveaways.length === 0 ? (
//               <p className="text-center text-muted-foreground py-4">
//                 No giveaways found.
//               </p>
//             ) : (
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Title</TableHead>
//                       <TableHead>Company</TableHead>
//                       <TableHead>Entries</TableHead>
//                       <TableHead>Prize Value</TableHead>
//                       <TableHead>End Date</TableHead>
//                       <TableHead>Created</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {giveaways.map((giveaway) => (
//                       <TableRow key={giveaway.id}>
//                         <TableCell className="font-medium">
//                           {giveaway.title}
//                         </TableCell>
//                         <TableCell>{giveaway.company_name}</TableCell>
//                         <TableCell>{giveaway.entries_count}</TableCell>
//                         <TableCell>
//                           {giveaway.prize_value
//                             ? `$${giveaway.prize_value.toFixed(2)}`
//                             : "N/A"}
//                         </TableCell>
//                         <TableCell>
//                           {new Date(giveaway.end_date).toLocaleDateString()}
//                         </TableCell>
//                         <TableCell>
//                           {new Date(giveaway.created_at).toLocaleDateString()}
//                         </TableCell>
//                         <TableCell>
//                           <Button variant="outline" size="sm" disabled>
//                             View/Edit
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Users Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>All Users</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <p className="text-center text-muted-foreground py-4">
//                 Loading users...
//               </p>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Email</TableHead>
//                     <TableHead>Full Name</TableHead>
//                     <TableHead>Role</TableHead>
//                     <TableHead>Joined</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {users.map((user) => (
//                     <TableRow key={user.id}>
//                       <TableCell>{user.email}</TableCell>
//                       <TableCell>{user.full_name}</TableCell>
//                       <TableCell>
//                         <Badge
//                           variant={
//                             user.role === "admin" ? "default" : "secondary"
//                           }
//                         >
//                           {user.role}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {new Date(user.created_at).toLocaleDateString()}
//                       </TableCell>
//                       <TableCell>
//                         {user.role !== "admin" && (
//                           <Button
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => handleDeleteUser(user.id)}
//                           >
//                             Delete
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// };

// export default AdminDashboard;

// import { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import {
//   LogOut,
//   Users,
//   Building2,
//   Gift,
//   Trophy,
//   Plus,
//   UserPlus,
//   Upload,
// } from "lucide-react";

// interface User {
//   id: string;
//   email: string;
//   full_name: string;
//   role: string;
//   created_at: string;
// }

// interface CompanyUser {
//   id: string;
//   email: string;
//   full_name: string | null;
// }

// interface Stats {
//   totalUsers: number;
//   totalCompanies: number;
//   totalGiveaways: number;
//   totalWinners: number;
// }

// const AdminDashboard = () => {
//   const { signOut } = useAuth();
//   const [users, setUsers] = useState<User[]>([]);
//   const [companies, setCompanies] = useState<CompanyUser[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     totalUsers: 0,
//     totalCompanies: 0,
//     totalGiveaways: 0,
//     totalWinners: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
//   const [isGiveawayDialogOpen, setIsGiveawayDialogOpen] = useState(false);
//   const [companyFormData, setCompanyFormData] = useState({
//     email: "",
//     password: "",
//     full_name: "",
//   });
//   const [giveawayFormData, setGiveawayFormData] = useState({
//     company_id: "",
//     title: "",
//     description: "",
//     image_url: "",
//     prize_value: "",
//     end_date: "",
//   });
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [uploadingImage, setUploadingImage] = useState(false);

//   useEffect(() => {
//     fetchData();
//     fetchCompanies();
//   }, []);

//   const fetchData = async () => {
//     try {
//       // Fetch all profiles
//       const { data: profiles, error: profilesError } = await supabase
//         .from("profiles")
//         .select("id, email, full_name, created_at")
//         .order("created_at", { ascending: false });

//       if (profilesError) throw profilesError;

//       // Fetch all user roles
//       const { data: roles, error: rolesError } = await supabase
//         .from("user_roles")
//         .select("user_id, role");

//       if (rolesError) throw rolesError;

//       // Create a map of user_id to role
//       const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

//       // Combine profiles with roles
//       const usersData = (profiles || []).map((profile: any) => ({
//         id: profile.id,
//         email: profile.email,
//         full_name: profile.full_name || "N/A",
//         role: roleMap.get(profile.id) || "user",
//         created_at: profile.created_at,
//       }));

//       setUsers(usersData);

//       // Calculate stats
//       const userCount = usersData.filter((u) => u.role === "user").length;
//       const companyCount = usersData.filter((u) => u.role === "company").length;

//       const { count: giveawayCount } = await supabase
//         .from("giveaways")
//         .select("*", { count: "exact", head: true });

//       const { count: winnerCount } = await supabase
//         .from("winners")
//         .select("*", { count: "exact", head: true });

//       setStats({
//         totalUsers: userCount,
//         totalCompanies: companyCount,
//         totalGiveaways: giveawayCount || 0,
//         totalWinners: winnerCount || 0,
//       });
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       toast.error("Failed to load admin data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCompanies = async () => {
//     try {
//       const { data: companyRoles } = await supabase
//         .from("user_roles")
//         .select("user_id")
//         .eq("role", "company");

//       if (!companyRoles) return;

//       const companyIds = companyRoles.map((r) => r.user_id);

//       if (companyIds.length === 0) {
//         setCompanies([]);
//         return;
//       }

//       const { data: profiles } = await supabase
//         .from("profiles")
//         .select("id, email, full_name")
//         .in("id", companyIds);

//       setCompanies(profiles || []);
//     } catch (error) {
//       console.error("Error fetching companies:", error);
//     }
//   };

//   const handleCreateCompany = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session) {
//         toast.error("You must be logged in");
//         return;
//       }

//       // Call Edge Function to create company with service role
//       const response = await fetch(
//         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-company`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${session.access_token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             email: companyFormData.email,
//             password: companyFormData.password,
//             full_name: companyFormData.full_name,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to create company account");
//       }

//       toast.success("Company account created successfully!");
//       setIsCompanyDialogOpen(false);
//       setCompanyFormData({ email: "", password: "", full_name: "" });
//       fetchData();
//       fetchCompanies();
//     } catch (error: any) {
//       toast.error(error.message || "Failed to create company account");
//       console.error(error);
//     }
//   };

//   const handleImageUpload = async (file: File): Promise<string | null> => {
//     try {
//       const fileExt = file.name.split(".").pop();
//       const fileName = `${Math.random()
//         .toString(36)
//         .substring(2)}-${Date.now()}.${fileExt}`;
//       const filePath = fileName;

//       const { error: uploadError } = await supabase.storage
//         .from("giveaway-images")
//         .upload(filePath, file);

//       if (uploadError) throw uploadError;

//       const {
//         data: { publicUrl },
//       } = supabase.storage.from("giveaway-images").getPublicUrl(filePath);

//       return publicUrl;
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       toast.error("Failed to upload image");
//       return null;
//     }
//   };

//   const handleCreateGiveaway = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate company selection
//     if (!giveawayFormData.company_id) {
//       toast.error("Please select a company");
//       return;
//     }

//     try {
//       setUploadingImage(true);

//       let imageUrl = giveawayFormData.image_url;

//       // If a file is selected, upload it
//       if (selectedImage) {
//         const uploadedUrl = await handleImageUpload(selectedImage);
//         if (uploadedUrl) {
//           imageUrl = uploadedUrl;
//         }
//       }

//       const { error } = await supabase.from("giveaways").insert({
//         company_id: giveawayFormData.company_id,
//         title: giveawayFormData.title,
//         description: giveawayFormData.description,
//         image_url: imageUrl || null,
//         prize_value: giveawayFormData.prize_value
//           ? parseFloat(giveawayFormData.prize_value)
//           : null,
//         end_date: giveawayFormData.end_date,
//       });

//       if (error) throw error;

//       toast.success("Giveaway created successfully!");
//       setIsGiveawayDialogOpen(false);
//       setGiveawayFormData({
//         company_id: "",
//         title: "",
//         description: "",
//         image_url: "",
//         prize_value: "",
//         end_date: "",
//       });
//       setSelectedImage(null);
//       fetchData();
//     } catch (error) {
//       toast.error("Failed to create giveaway");
//       console.error(error);
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (!confirm("Are you sure you want to delete this user?")) return;

//     try {
//       // Note: In a production app, you'd want to use an Edge Function for this
//       // as deleting auth users requires service role key
//       toast.error("User deletion requires admin privileges via backend");
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       toast.error("Failed to delete user");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//             <Button variant="outline" onClick={signOut}>
//               <LogOut className="w-4 h-4 mr-2" />
//               Sign Out
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         {/* Action Buttons */}
//         <div className="flex gap-4 mb-8">
//           <Dialog
//             open={isCompanyDialogOpen}
//             onOpenChange={setIsCompanyDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button>
//                 <UserPlus className="w-4 h-4 mr-2" />
//                 Create Company Account
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Create Company Account</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateCompany} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_email">Email *</Label>
//                   <Input
//                     id="company_email"
//                     type="email"
//                     value={companyFormData.email}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         email: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_password">Password *</Label>
//                   <Input
//                     id="company_password"
//                     type="password"
//                     value={companyFormData.password}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         password: e.target.value,
//                       })
//                     }
//                     required
//                     minLength={6}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_name">Company Name *</Label>
//                   <Input
//                     id="company_name"
//                     value={companyFormData.full_name}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         full_name: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button type="submit" className="w-full">
//                   Create Company
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>

//           <Dialog
//             open={isGiveawayDialogOpen}
//             onOpenChange={setIsGiveawayDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button variant="secondary">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create Giveaway
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Create Giveaway for Company</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateGiveaway} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_select">Select Company *</Label>
//                   <Select
//                     value={giveawayFormData.company_id}
//                     onValueChange={(value) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         company_id: value,
//                       })
//                     }
//                     required
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose a company" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {companies.length === 0 ? (
//                         <div className="p-2 text-sm text-muted-foreground">
//                           No companies available
//                         </div>
//                       ) : (
//                         companies.map((company) => (
//                           <SelectItem key={company.id} value={company.id}>
//                             {company.full_name || company.email}
//                           </SelectItem>
//                         ))
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_title">Title *</Label>
//                   <Input
//                     id="giveaway_title"
//                     value={giveawayFormData.title}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         title: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_description">Description *</Label>
//                   <Textarea
//                     id="giveaway_description"
//                     value={giveawayFormData.description}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         description: e.target.value,
//                       })
//                     }
//                     required
//                     rows={4}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_image">Image</Label>
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <Input
//                         id="giveaway_image_file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0];
//                           if (file) {
//                             setSelectedImage(file);
//                             setGiveawayFormData({
//                               ...giveawayFormData,
//                               image_url: "",
//                             });
//                           }
//                         }}
//                         className="flex-1"
//                       />
//                       <Upload className="w-4 h-4 text-muted-foreground" />
//                     </div>
//                     <div className="text-center text-sm text-muted-foreground">
//                       or
//                     </div>
//                     <Input
//                       id="giveaway_image_url"
//                       type="url"
//                       value={giveawayFormData.image_url}
//                       onChange={(e) => {
//                         setGiveawayFormData({
//                           ...giveawayFormData,
//                           image_url: e.target.value,
//                         });
//                         setSelectedImage(null);
//                       }}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                   {selectedImage && (
//                     <p className="text-sm text-muted-foreground">
//                       Selected: {selectedImage.name}
//                     </p>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_prize">Prize Value ($)</Label>
//                   <Input
//                     id="giveaway_prize"
//                     type="number"
//                     step="0.01"
//                     value={giveawayFormData.prize_value}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         prize_value: e.target.value,
//                       })
//                     }
//                     placeholder="100.00"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_end">End Date *</Label>
//                   <Input
//                     id="giveaway_end"
//                     type="datetime-local"
//                     value={giveawayFormData.end_date}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         end_date: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   className="w-full"
//                   disabled={uploadingImage}
//                 >
//                   {uploadingImage ? "Uploading..." : "Create Giveaway"}
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//               <Users className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalUsers}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Companies
//               </CardTitle>
//               <Building2 className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalCompanies}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Giveaways
//               </CardTitle>
//               <Gift className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalGiveaways}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Winners
//               </CardTitle>
//               <Trophy className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalWinners}</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Users Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>All Users</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <p className="text-center text-muted-foreground py-4">
//                 Loading users...
//               </p>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Email</TableHead>
//                     <TableHead>Full Name</TableHead>
//                     <TableHead>Role</TableHead>
//                     <TableHead>Joined</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {users.map((user) => (
//                     <TableRow key={user.id}>
//                       <TableCell>{user.email}</TableCell>
//                       <TableCell>{user.full_name}</TableCell>
//                       <TableCell>
//                         <Badge
//                           variant={
//                             user.role === "admin" ? "default" : "secondary"
//                           }
//                         >
//                           {user.role}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {new Date(user.created_at).toLocaleDateString()}
//                       </TableCell>
//                       <TableCell>
//                         {user.role !== "admin" && (
//                           <Button
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => handleDeleteUser(user.id)}
//                           >
//                             Delete
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// };

// export default AdminDashboard;

//EDIT/VIEW
// import { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import {
//   LogOut,
//   Users,
//   Building2,
//   Gift,
//   Trophy,
//   Plus,
//   UserPlus,
//   Upload,
// } from "lucide-react";

// interface User {
//   id: string;
//   email: string;
//   full_name: string;
//   role: string;
//   created_at: string;
// }

// interface CompanyUser {
//   id: string;
//   email: string;
//   full_name: string | null;
// }

// interface Giveaway {
//   id: string;
//   title: string;
//   prize_value: number | null;
//   end_date: string;
//   company_id: string;
//   company_name: string;
//   created_at: string;
//   entries_count: number;
// }

// interface Stats {
//   totalUsers: number;
//   totalCompanies: number;
//   totalGiveaways: number;
//   totalWinners: number;
// }

// const AdminDashboard = () => {
//   const { signOut } = useAuth();
//   const [users, setUsers] = useState<User[]>([]);
//   const [companies, setCompanies] = useState<CompanyUser[]>([]);
//   const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     totalUsers: 0,
//     totalCompanies: 0,
//     totalGiveaways: 0,
//     totalWinners: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
//   const [isGiveawayDialogOpen, setIsGiveawayDialogOpen] = useState(false);
//   const [companyFormData, setCompanyFormData] = useState({
//     email: "",
//     password: "",
//     full_name: "",
//   });
//   const [giveawayFormData, setGiveawayFormData] = useState({
//     company_id: "",
//     title: "",
//     description: "",
//     image_url: "",
//     prize_value: "",
//     end_date: "",
//   });
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [uploadingImage, setUploadingImage] = useState(false);

//   useEffect(() => {
//     const loadData = async () => {
//       // 1. Fetch companies first, as it's a dependency for fetching giveaways
//       const companyProfiles = await fetchCompanies();
//       await fetchData();
//       await fetchGiveaways(companyProfiles);
//       setLoading(false);
//     };
//     loadData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       // Fetch all profiles
//       const { data: profiles, error: profilesError } = await supabase
//         .from("profiles")
//         .select("id, email, full_name, created_at")
//         .order("created_at", { ascending: false });

//       if (profilesError) throw profilesError;

//       // Fetch all user roles
//       const { data: roles, error: rolesError } = await supabase
//         .from("user_roles")
//         .select("user_id, role");

//       if (rolesError) throw rolesError;

//       // Create a map of user_id to role
//       const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

//       // Combine profiles with roles
//       const usersData = (profiles || []).map((profile: any) => ({
//         id: profile.id,
//         email: profile.email,
//         full_name: profile.full_name || "N/A",
//         role: roleMap.get(profile.id) || "user",
//         created_at: profile.created_at,
//       }));

//       setUsers(usersData);

//       // Calculate stats (giveaway count is updated in fetchGiveaways)
//       const userCount = usersData.filter((u) => u.role === "user").length;
//       const companyCount = usersData.filter((u) => u.role === "company").length;

//       const { count: winnerCount } = await supabase
//         .from("winners")
//         .select("*", { count: "exact", head: true });

//       setStats((prev) => ({
//         ...prev,
//         totalUsers: userCount,
//         totalCompanies: companyCount,
//         totalWinners: winnerCount || 0,
//       }));
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       toast.error("Failed to load admin data");
//     }
//   };

//   // UPDATED: Now returns the company data for use in fetchGiveaways
//   const fetchCompanies = async (): Promise<CompanyUser[]> => {
//     try {
//       const { data: companyRoles } = await supabase
//         .from("user_roles")
//         .select("user_id")
//         .eq("role", "company");

//       if (!companyRoles) return [];

//       const companyIds = companyRoles.map((r) => r.user_id);

//       if (companyIds.length === 0) {
//         setCompanies([]);
//         return [];
//       }

//       const { data: profiles } = await supabase
//         .from("profiles")
//         .select("id, email, full_name")
//         .in("id", companyIds);

//       const companyData = profiles || [];
//       setCompanies(companyData);
//       return companyData;
//     } catch (error) {
//       console.error("Error fetching companies:", error);
//       return [];
//     }
//   };

//   // UPDATED: Now accepts companyProfiles and avoids the RLS-sensitive JOIN
//   const fetchGiveaways = async (companyProfiles: CompanyUser[]) => {
//     try {
//       // Create a map for quick company name lookup
//       const companyMap = new Map(
//         (companyProfiles || []).map((p) => [p.id, p.full_name || "N/A"])
//       );

//       // Fetch all giveaways using a simple select
//       const { data: giveawaysData, error } = await supabase
//         .from("giveaways")
//         .select(`id, title, prize_value, end_date, created_at, company_id`)
//         .order("created_at", { ascending: false });

//       if (error) throw error;

//       // Fetch entry counts and map company names in parallel (like UserDashboard.tsx)
//       const giveawaysWithDetails = await Promise.all(
//         (giveawaysData || []).map(async (g) => {
//           const { count } = await supabase
//             .from("giveaway_entries")
//             .select("*", { count: "exact", head: true })
//             .eq("giveaway_id", g.id);

//           return {
//             id: g.id,
//             title: g.title,
//             prize_value: g.prize_value,
//             end_date: g.end_date,
//             company_id: g.company_id,
//             company_name: companyMap.get(g.company_id) || "Unknown Company", // Look up name
//             created_at: g.created_at,
//             entries_count: count || 0,
//           };
//         })
//       );

//       setGiveaways(giveawaysWithDetails);
//       setStats((prev) => ({
//         ...prev,
//         totalGiveaways: giveawaysData.length,
//       }));
//     } catch (error) {
//       console.error("Error fetching giveaways:", error);
//       toast.error("Failed to load giveaways");
//     }
//   };

//   // ... (handleCreateCompany, handleImageUpload, handleCreateGiveaway, handleDeleteUser remain the same)
//   const handleCreateCompany = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session) {
//         toast.error("You must be logged in");
//         return;
//       }

//       // Call Edge Function to create company with service role
//       const response = await fetch(
//         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-company`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${session.access_token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             email: companyFormData.email,
//             password: companyFormData.password,
//             full_name: companyFormData.full_name,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to create company account");
//       }

//       toast.success("Company account created successfully!");
//       setIsCompanyDialogOpen(false);
//       setCompanyFormData({ email: "", password: "", full_name: "" });
//       // Reload all data after creation
//       const companyProfiles = await fetchCompanies();
//       fetchData();
//       fetchGiveaways(companyProfiles);
//     } catch (error: any) {
//       toast.error(error.message || "Failed to create company account");
//       console.error(error);
//     }
//   };

//   const handleImageUpload = async (file: File): Promise<string | null> => {
//     try {
//       const fileExt = file.name.split(".").pop();
//       const fileName = `${Math.random()
//         .toString(36)
//         .substring(2)}-${Date.now()}.${fileExt}`;
//       const filePath = fileName;

//       const { error: uploadError } = await supabase.storage
//         .from("giveaway-images")
//         .upload(filePath, file);

//       if (uploadError) throw uploadError;

//       const {
//         data: { publicUrl },
//       } = supabase.storage.from("giveaway-images").getPublicUrl(filePath);

//       return publicUrl;
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       toast.error("Failed to upload image");
//       return null;
//     }
//   };

//   const handleCreateGiveaway = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate company selection
//     if (!giveawayFormData.company_id) {
//       toast.error("Please select a company");
//       return;
//     }

//     try {
//       setUploadingImage(true);

//       let imageUrl = giveawayFormData.image_url;

//       // If a file is selected, upload it
//       if (selectedImage) {
//         const uploadedUrl = await handleImageUpload(selectedImage);
//         if (uploadedUrl) {
//           imageUrl = uploadedUrl;
//         }
//       }

//       const { error } = await supabase.from("giveaways").insert({
//         company_id: giveawayFormData.company_id,
//         title: giveawayFormData.title,
//         description: giveawayFormData.description,
//         image_url: imageUrl || null,
//         prize_value: giveawayFormData.prize_value
//           ? parseFloat(giveawayFormData.prize_value)
//           : null,
//         end_date: giveawayFormData.end_date,
//       });

//       if (error) throw error;

//       toast.success("Giveaway created successfully!");
//       setIsGiveawayDialogOpen(false);
//       setGiveawayFormData({
//         company_id: "",
//         title: "",
//         description: "",
//         image_url: "",
//         prize_value: "",
//         end_date: "",
//       });
//       setSelectedImage(null);
//       // Reload all data after creation
//       const companyProfiles = await fetchCompanies();
//       fetchData();
//       fetchGiveaways(companyProfiles); // Refresh giveaways list
//     } catch (error) {
//       toast.error("Failed to create giveaway");
//       console.error(error);
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (!confirm("Are you sure you want to delete this user?")) return;

//     try {
//       // Note: In a production app, you'd want to use an Edge Function for this
//       // as deleting auth users requires service role key
//       toast.error("User deletion requires admin privileges via backend");
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       toast.error("Failed to delete user");
//     }
//   };
//   // ... (Rest of the component remains the same)

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//             <Button variant="outline" onClick={signOut}>
//               <LogOut className="w-4 h-4 mr-2" />
//               Sign Out
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         {/* Action Buttons */}
//         <div className="flex gap-4 mb-8">
//           <Dialog
//             open={isCompanyDialogOpen}
//             onOpenChange={setIsCompanyDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button>
//                 <UserPlus className="w-4 h-4 mr-2" />
//                 Create Company Account
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Create Company Account</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateCompany} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_email">Email *</Label>
//                   <Input
//                     id="company_email"
//                     type="email"
//                     value={companyFormData.email}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         email: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_password">Password *</Label>
//                   <Input
//                     id="company_password"
//                     type="password"
//                     value={companyFormData.password}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         password: e.target.value,
//                       })
//                     }
//                     required
//                     minLength={6}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_name">Company Name *</Label>
//                   <Input
//                     id="company_name"
//                     value={companyFormData.full_name}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         full_name: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button type="submit" className="w-full">
//                   Create Company
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>

//           <Dialog
//             open={isGiveawayDialogOpen}
//             onOpenChange={setIsGiveawayDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button variant="secondary">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create Giveaway
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Create Giveaway for Company</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateGiveaway} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_select">Select Company *</Label>
//                   <Select
//                     value={giveawayFormData.company_id}
//                     onValueChange={(value) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         company_id: value,
//                       })
//                     }
//                     required
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose a company" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {companies.length === 0 ? (
//                         <div className="p-2 text-sm text-muted-foreground">
//                           No companies available
//                         </div>
//                       ) : (
//                         companies.map((company) => (
//                           <SelectItem key={company.id} value={company.id}>
//                             {company.full_name || company.email}
//                           </SelectItem>
//                         ))
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_title">Title *</Label>
//                   <Input
//                     id="giveaway_title"
//                     value={giveawayFormData.title}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         title: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_description">Description *</Label>
//                   <Textarea
//                     id="giveaway_description"
//                     value={giveawayFormData.description}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         description: e.target.value,
//                       })
//                     }
//                     required
//                     rows={4}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_image">Image</Label>
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <Input
//                         id="giveaway_image_file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0];
//                           if (file) {
//                             setSelectedImage(file);
//                             setGiveawayFormData({
//                               ...giveawayFormData,
//                               image_url: "",
//                             });
//                           }
//                         }}
//                         className="flex-1"
//                       />
//                       <Upload className="w-4 h-4 text-muted-foreground" />
//                     </div>
//                     <div className="text-center text-sm text-muted-foreground">
//                       or
//                     </div>
//                     <Input
//                       id="giveaway_image_url"
//                       type="url"
//                       value={giveawayFormData.image_url}
//                       onChange={(e) => {
//                         setGiveawayFormData({
//                           ...giveawayFormData,
//                           image_url: e.target.value,
//                         });
//                         setSelectedImage(null);
//                       }}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                   {selectedImage && (
//                     <p className="text-sm text-muted-foreground">
//                       Selected: {selectedImage.name}
//                     </p>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_prize">Prize Value ($)</Label>
//                   <Input
//                     id="giveaway_prize"
//                     type="number"
//                     step="0.01"
//                     value={giveawayFormData.prize_value}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         prize_value: e.target.value,
//                       })
//                     }
//                     placeholder="100.00"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_end">End Date *</Label>
//                   <Input
//                     id="giveaway_end"
//                     type="datetime-local"
//                     value={giveawayFormData.end_date}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         end_date: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   className="w-full"
//                   disabled={uploadingImage}
//                 >
//                   {uploadingImage ? "Uploading..." : "Create Giveaway"}
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//               <Users className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalUsers}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Companies
//               </CardTitle>
//               <Building2 className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalCompanies}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Giveaways
//               </CardTitle>
//               <Gift className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalGiveaways}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Winners
//               </CardTitle>
//               <Trophy className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalWinners}</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Giveaways Table - NEW SECTION */}
//         <Card className="mb-8">
//           <CardHeader>
//             <CardTitle>All Giveaways</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <p className="text-center text-muted-foreground py-4">
//                 Loading giveaways...
//               </p>
//             ) : giveaways.length === 0 ? (
//               <p className="text-center text-muted-foreground py-4">
//                 No giveaways found.
//               </p>
//             ) : (
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Title</TableHead>
//                       <TableHead>Company</TableHead>
//                       <TableHead>Entries</TableHead>
//                       <TableHead>Prize Value</TableHead>
//                       <TableHead>End Date</TableHead>
//                       <TableHead>Created</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {giveaways.map((giveaway) => (
//                       <TableRow key={giveaway.id}>
//                         <TableCell className="font-medium">
//                           {giveaway.title}
//                         </TableCell>
//                         <TableCell>{giveaway.company_name}</TableCell>
//                         <TableCell>{giveaway.entries_count}</TableCell>
//                         <TableCell>
//                           {giveaway.prize_value
//                             ? `$${giveaway.prize_value.toFixed(2)}`
//                             : "N/A"}
//                         </TableCell>
//                         <TableCell>
//                           {new Date(giveaway.end_date).toLocaleDateString()}
//                         </TableCell>
//                         <TableCell>
//                           {new Date(giveaway.created_at).toLocaleDateString()}
//                         </TableCell>
//                         <TableCell>
//                           <Button variant="outline" size="sm" disabled>
//                             View/Edit
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Users Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>All Users</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <p className="text-center text-muted-foreground py-4">
//                 Loading users...
//               </p>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Email</TableHead>
//                     <TableHead>Full Name</TableHead>
//                     <TableHead>Role</TableHead>
//                     <TableHead>Joined</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {users.map((user) => (
//                     <TableRow key={user.id}>
//                       <TableCell>{user.email}</TableCell>
//                       <TableCell>{user.full_name}</TableCell>
//                       <TableCell>
//                         <Badge
//                           variant={
//                             user.role === "admin" ? "default" : "secondary"
//                           }
//                         >
//                           {user.role}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {new Date(user.created_at).toLocaleDateString()}
//                       </TableCell>
//                       <TableCell>
//                         {user.role !== "admin" && (
//                           <Button
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => handleDeleteUser(user.id)}
//                           >
//                             Delete
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// };

// export default AdminDashboard;

// import { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import {
//   LogOut,
//   Users,
//   Building2,
//   Gift,
//   Trophy,
//   Plus,
//   UserPlus,
//   Upload,
// } from "lucide-react";

// interface User {
//   id: string;
//   email: string;
//   full_name: string;
//   role: string;
//   created_at: string;
// }

// interface CompanyUser {
//   id: string;
//   email: string;
//   full_name: string | null;
// }

// interface Stats {
//   totalUsers: number;
//   totalCompanies: number;
//   totalGiveaways: number;
//   totalWinners: number;
// }

// const AdminDashboard = () => {
//   const { signOut } = useAuth();
//   const [users, setUsers] = useState<User[]>([]);
//   const [companies, setCompanies] = useState<CompanyUser[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     totalUsers: 0,
//     totalCompanies: 0,
//     totalGiveaways: 0,
//     totalWinners: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
//   const [isGiveawayDialogOpen, setIsGiveawayDialogOpen] = useState(false);
//   const [companyFormData, setCompanyFormData] = useState({
//     email: "",
//     password: "",
//     full_name: "",
//   });
//   const [giveawayFormData, setGiveawayFormData] = useState({
//     company_id: "",
//     title: "",
//     description: "",
//     image_url: "",
//     prize_value: "",
//     end_date: "",
//   });
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [uploadingImage, setUploadingImage] = useState(false);

//   useEffect(() => {
//     fetchData();
//     fetchCompanies();
//   }, []);

//   const fetchData = async () => {
//     try {
//       // Fetch all profiles
//       const { data: profiles, error: profilesError } = await supabase
//         .from("profiles")
//         .select("id, email, full_name, created_at")
//         .order("created_at", { ascending: false });

//       if (profilesError) throw profilesError;

//       // Fetch all user roles
//       const { data: roles, error: rolesError } = await supabase
//         .from("user_roles")
//         .select("user_id, role");

//       if (rolesError) throw rolesError;

//       // Create a map of user_id to role
//       const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

//       // Combine profiles with roles
//       const usersData = (profiles || []).map((profile: any) => ({
//         id: profile.id,
//         email: profile.email,
//         full_name: profile.full_name || "N/A",
//         role: roleMap.get(profile.id) || "user",
//         created_at: profile.created_at,
//       }));

//       setUsers(usersData);

//       // Calculate stats
//       const userCount = usersData.filter((u) => u.role === "user").length;
//       const companyCount = usersData.filter((u) => u.role === "company").length;

//       const { count: giveawayCount } = await supabase
//         .from("giveaways")
//         .select("*", { count: "exact", head: true });

//       const { count: winnerCount } = await supabase
//         .from("winners")
//         .select("*", { count: "exact", head: true });

//       setStats({
//         totalUsers: userCount,
//         totalCompanies: companyCount,
//         totalGiveaways: giveawayCount || 0,
//         totalWinners: winnerCount || 0,
//       });
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       toast.error("Failed to load admin data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCompanies = async () => {
//     try {
//       const { data: companyRoles } = await supabase
//         .from("user_roles")
//         .select("user_id")
//         .eq("role", "company");

//       if (!companyRoles) return;

//       const companyIds = companyRoles.map((r) => r.user_id);

//       if (companyIds.length === 0) {
//         setCompanies([]);
//         return;
//       }

//       const { data: profiles } = await supabase
//         .from("profiles")
//         .select("id, email, full_name")
//         .in("id", companyIds);

//       setCompanies(profiles || []);
//     } catch (error) {
//       console.error("Error fetching companies:", error);
//     }
//   };

//   const handleCreateCompany = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session) {
//         toast.error("You must be logged in");
//         return;
//       }

//       // Call Edge Function to create company with service role
//       const response = await fetch(
//         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-company`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${session.access_token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             email: companyFormData.email,
//             password: companyFormData.password,
//             full_name: companyFormData.full_name,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to create company account");
//       }

//       toast.success("Company account created successfully!");
//       setIsCompanyDialogOpen(false);
//       setCompanyFormData({ email: "", password: "", full_name: "" });
//       fetchData();
//       fetchCompanies();
//     } catch (error: any) {
//       toast.error(error.message || "Failed to create company account");
//       console.error(error);
//     }
//   };

//   const handleImageUpload = async (file: File): Promise<string | null> => {
//     try {
//       const fileExt = file.name.split(".").pop();
//       const fileName = `${Math.random()
//         .toString(36)
//         .substring(2)}-${Date.now()}.${fileExt}`;
//       const filePath = fileName;

//       const { error: uploadError } = await supabase.storage
//         .from("giveaway-images")
//         .upload(filePath, file);

//       if (uploadError) throw uploadError;

//       const {
//         data: { publicUrl },
//       } = supabase.storage.from("giveaway-images").getPublicUrl(filePath);

//       return publicUrl;
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       toast.error("Failed to upload image");
//       return null;
//     }
//   };

//   const handleCreateGiveaway = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate company selection
//     if (!giveawayFormData.company_id) {
//       toast.error("Please select a company");
//       return;
//     }

//     try {
//       setUploadingImage(true);

//       let imageUrl = giveawayFormData.image_url;

//       // If a file is selected, upload it
//       if (selectedImage) {
//         const uploadedUrl = await handleImageUpload(selectedImage);
//         if (uploadedUrl) {
//           imageUrl = uploadedUrl;
//         }
//       }

//       const { error } = await supabase.from("giveaways").insert({
//         company_id: giveawayFormData.company_id,
//         title: giveawayFormData.title,
//         description: giveawayFormData.description,
//         image_url: imageUrl || null,
//         prize_value: giveawayFormData.prize_value
//           ? parseFloat(giveawayFormData.prize_value)
//           : null,
//         end_date: giveawayFormData.end_date,
//       });

//       if (error) throw error;

//       toast.success("Giveaway created successfully!");
//       setIsGiveawayDialogOpen(false);
//       setGiveawayFormData({
//         company_id: "",
//         title: "",
//         description: "",
//         image_url: "",
//         prize_value: "",
//         end_date: "",
//       });
//       setSelectedImage(null);
//       fetchData();
//     } catch (error) {
//       toast.error("Failed to create giveaway");
//       console.error(error);
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (!confirm("Are you sure you want to delete this user?")) return;

//     try {
//       // Note: In a production app, you'd want to use an Edge Function for this
//       // as deleting auth users requires service role key
//       toast.error("User deletion requires admin privileges via backend");
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       toast.error("Failed to delete user");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//             <Button variant="outline" onClick={signOut}>
//               <LogOut className="w-4 h-4 mr-2" />
//               Sign Out
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         {/* Action Buttons */}
//         <div className="flex gap-4 mb-8">
//           <Dialog
//             open={isCompanyDialogOpen}
//             onOpenChange={setIsCompanyDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button>
//                 <UserPlus className="w-4 h-4 mr-2" />
//                 Create Company Account
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Create Company Account</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateCompany} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_email">Email *</Label>
//                   <Input
//                     id="company_email"
//                     type="email"
//                     value={companyFormData.email}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         email: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_password">Password *</Label>
//                   <Input
//                     id="company_password"
//                     type="password"
//                     value={companyFormData.password}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         password: e.target.value,
//                       })
//                     }
//                     required
//                     minLength={6}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="company_name">Company Name *</Label>
//                   <Input
//                     id="company_name"
//                     value={companyFormData.full_name}
//                     onChange={(e) =>
//                       setCompanyFormData({
//                         ...companyFormData,
//                         full_name: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button type="submit" className="w-full">
//                   Create Company
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>

//           <Dialog
//             open={isGiveawayDialogOpen}
//             onOpenChange={setIsGiveawayDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button variant="secondary">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create Giveaway
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Create Giveaway for Company</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateGiveaway} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="company_select">Select Company *</Label>
//                   <Select
//                     value={giveawayFormData.company_id}
//                     onValueChange={(value) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         company_id: value,
//                       })
//                     }
//                     required
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose a company" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {companies.length === 0 ? (
//                         <div className="p-2 text-sm text-muted-foreground">
//                           No companies available
//                         </div>
//                       ) : (
//                         companies.map((company) => (
//                           <SelectItem key={company.id} value={company.id}>
//                             {company.full_name || company.email}
//                           </SelectItem>
//                         ))
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_title">Title *</Label>
//                   <Input
//                     id="giveaway_title"
//                     value={giveawayFormData.title}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         title: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_description">Description *</Label>
//                   <Textarea
//                     id="giveaway_description"
//                     value={giveawayFormData.description}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         description: e.target.value,
//                       })
//                     }
//                     required
//                     rows={4}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_image">Image</Label>
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <Input
//                         id="giveaway_image_file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0];
//                           if (file) {
//                             setSelectedImage(file);
//                             setGiveawayFormData({
//                               ...giveawayFormData,
//                               image_url: "",
//                             });
//                           }
//                         }}
//                         className="flex-1"
//                       />
//                       <Upload className="w-4 h-4 text-muted-foreground" />
//                     </div>
//                     <div className="text-center text-sm text-muted-foreground">
//                       or
//                     </div>
//                     <Input
//                       id="giveaway_image_url"
//                       type="url"
//                       value={giveawayFormData.image_url}
//                       onChange={(e) => {
//                         setGiveawayFormData({
//                           ...giveawayFormData,
//                           image_url: e.target.value,
//                         });
//                         setSelectedImage(null);
//                       }}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                   {selectedImage && (
//                     <p className="text-sm text-muted-foreground">
//                       Selected: {selectedImage.name}
//                     </p>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_prize">Prize Value ($)</Label>
//                   <Input
//                     id="giveaway_prize"
//                     type="number"
//                     step="0.01"
//                     value={giveawayFormData.prize_value}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         prize_value: e.target.value,
//                       })
//                     }
//                     placeholder="100.00"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="giveaway_end">End Date *</Label>
//                   <Input
//                     id="giveaway_end"
//                     type="datetime-local"
//                     value={giveawayFormData.end_date}
//                     onChange={(e) =>
//                       setGiveawayFormData({
//                         ...giveawayFormData,
//                         end_date: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   className="w-full"
//                   disabled={uploadingImage}
//                 >
//                   {uploadingImage ? "Uploading..." : "Create Giveaway"}
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//               <Users className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalUsers}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Companies
//               </CardTitle>
//               <Building2 className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalCompanies}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Giveaways
//               </CardTitle>
//               <Gift className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalGiveaways}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">
//                 Total Winners
//               </CardTitle>
//               <Trophy className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalWinners}</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Users Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>All Users</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <p className="text-center text-muted-foreground py-4">
//                 Loading users...
//               </p>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Email</TableHead>
//                     <TableHead>Full Name</TableHead>
//                     <TableHead>Role</TableHead>
//                     <TableHead>Joined</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {users.map((user) => (
//                     <TableRow key={user.id}>
//                       <TableCell>{user.email}</TableCell>
//                       <TableCell>{user.full_name}</TableCell>
//                       <TableCell>
//                         <Badge
//                           variant={
//                             user.role === "admin" ? "default" : "secondary"
//                           }
//                         >
//                           {user.role}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {new Date(user.created_at).toLocaleDateString()}
//                       </TableCell>
//                       <TableCell>
//                         {user.role !== "admin" && (
//                           <Button
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => handleDeleteUser(user.id)}
//                           >
//                             Delete
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// };

// export default AdminDashboard;
