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
  Percent,
  Package,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  totalPromotions: number;
}

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  company_id: string;
  price: number;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<CompanyUser[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalGiveaways: 0,
    totalWinners: 0,
    totalPromotions: 0,
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
    logo_url: "",
  });
  const [selectedUserLogo, setSelectedUserLogo] = useState<File | null>(null);
  const [uploadingUserLogo, setUploadingUserLogo] = useState(false);

  const [companyFormData, setCompanyFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    logo_url: "",
    youtube_url: "",
    instagram_url: "",
    twitter_url: "",
    tiktok_url: "",
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
  const [giveawayRequirements, setGiveawayRequirements] = useState({
    require_email_verified: true,
    require_company_follow: true,
    require_youtube: false,
    require_instagram: false,
    require_twitter: false,
    require_tiktok: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Promotion state
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [promotionFormData, setPromotionFormData] = useState({
    name: "",
    description: "",
    discount_percentage: "",
    start_date: "",
    end_date: "",
  });

  const resetGiveawayForm = () => {
    setGiveawayFormData({
      company_id: "",
      title: "",
      description: "",
      image_url: "",
      prize_value: "",
      end_date: "",
    });
    setGiveawayRequirements({
      require_email_verified: true,
      require_company_follow: true,
      require_youtube: false,
      require_instagram: false,
      require_twitter: false,
      require_tiktok: false,
    });
    setSelectedImage(null);
    setEditingGiveaway(null);
  };

  const resetPromotionForm = () => {
    setPromotionFormData({
      name: "",
      description: "",
      discount_percentage: "",
      start_date: "",
      end_date: "",
    });
    setSelectedProductIds([]);
    setEditingPromotion(null);
  };

  useEffect(() => {
    const loadData = async () => {
      const companyProfiles = await fetchCompanies();
      await fetchData();
      await fetchGiveaways(companyProfiles);
      await fetchPromotions();
      await fetchProducts();
      setLoading(false);
    };
    loadData();
  }, []);

  // Sync state with form when editingGiveaway changes
  useEffect(() => {
    const loadGiveawayData = async () => {
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

        // Load existing requirements
        const { data: reqData } = await supabase
          .from("giveaway_requirements")
          .select("*")
          .eq("giveaway_id", editingGiveaway.id)
          .single();

        if (reqData) {
          setGiveawayRequirements({
            require_email_verified: reqData.require_email_verified,
            require_company_follow: reqData.require_company_follow,
            require_youtube: reqData.require_youtube,
            require_instagram: reqData.require_instagram,
            require_twitter: reqData.require_twitter,
            require_tiktok: reqData.require_tiktok,
          });
        }

        setIsGiveawayDialogOpen(true);
      } else {
        resetGiveawayForm();
      }
    };
    loadGiveawayData();
  }, [editingGiveaway]);

  // Sync state with form when editingPromotion changes
  useEffect(() => {
    if (editingPromotion) {
      const formattedStartDate = format(
        new Date(editingPromotion.start_date),
        "yyyy-MM-dd'T'HH:mm"
      );
      const formattedEndDate = format(
        new Date(editingPromotion.end_date),
        "yyyy-MM-dd'T'HH:mm"
      );

      setPromotionFormData({
        name: editingPromotion.name,
        description: editingPromotion.description || "",
        discount_percentage: editingPromotion.discount_percentage.toString(),
        start_date: formattedStartDate,
        end_date: formattedEndDate,
      });

      // Fetch linked products for this promotion
      fetchPromotionProducts(editingPromotion.id);
      setIsPromotionDialogOpen(true);
    } else {
      resetPromotionForm();
    }
  }, [editingPromotion]);

  const fetchPromotionProducts = async (promotionId: string) => {
    const { data } = await supabase
      .from("promotion_products")
      .select("product_id")
      .eq("promotion_id", promotionId);
    
    if (data) {
      setSelectedProductIds(data.map(p => p.product_id));
    }
  };

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

      interface ProfileData {
        id: string;
        email: string;
        full_name: string | null;
        created_at: string;
      }

      const usersData = (profiles || []).map((profile: ProfileData) => ({
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

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPromotions(data || []);
      setStats((prev) => ({
        ...prev,
        totalPromotions: data?.length || 0,
      }));
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error("Failed to load promotions");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, company_id, price")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
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
            youtube_url: companyFormData.youtube_url,
            instagram_url: companyFormData.instagram_url,
            twitter_url: companyFormData.twitter_url,
            tiktok_url: companyFormData.tiktok_url,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create company account");
      }

      toast.success("Company account created successfully!");
      setIsCompanyDialogOpen(false);
      setCompanyFormData({ email: "", password: "", full_name: "", logo_url: "", youtube_url: "", instagram_url: "", twitter_url: "", tiktok_url: "" });
      setSelectedCompanyLogo(null);
      const companyProfiles = await fetchCompanies();
      fetchData();
      fetchGiveaways(companyProfiles);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create company account");
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

      // Save giveaway requirements
      const requirementsPayload = {
        giveaway_id: giveawayId,
        require_email_verified: giveawayRequirements.require_email_verified,
        require_company_follow: giveawayRequirements.require_company_follow,
        require_youtube: giveawayRequirements.require_youtube,
        require_instagram: giveawayRequirements.require_instagram,
        require_twitter: giveawayRequirements.require_twitter,
        require_tiktok: giveawayRequirements.require_tiktok,
      };

      if (editingGiveaway) {
        // Update existing requirements
        const { data: existingReq } = await supabase
          .from("giveaway_requirements")
          .select("id")
          .eq("giveaway_id", giveawayId)
          .single();

        if (existingReq) {
          await supabase
            .from("giveaway_requirements")
            .update(requirementsPayload)
            .eq("giveaway_id", giveawayId);
        } else {
          await supabase.from("giveaway_requirements").insert(requirementsPayload);
        }
      } else {
        // Create new requirements
        await supabase.from("giveaway_requirements").insert(requirementsPayload);
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
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const handleEditUser = async (user: User) => {
    setEditingUser(user);
    
    // Fetch current logo_url for the user
    const { data: profileData } = await supabase
      .from("profiles")
      .select("logo_url")
      .eq("id", user.id)
      .single();
    
    setUserFormData({
      full_name: user.full_name || "",
      role: user.role,
      logo_url: profileData?.logo_url || "",
    });
    setSelectedUserLogo(null);
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUploadingUserLogo(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      let logoUrl = userFormData.logo_url;

      // Upload new logo if selected
      if (selectedUserLogo) {
        const fileExt = selectedUserLogo.name.split(".").pop();
        const fileName = `company-logo-${editingUser.id}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("giveaway-images")
          .upload(filePath, selectedUserLogo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("giveaway-images")
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
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
            logo_url: logoUrl,
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
      setSelectedUserLogo(null);
      const companyProfiles = await fetchCompanies();
      fetchData();
      fetchGiveaways(companyProfiles);
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setUploadingUserLogo(false);
    }
  };

  // Promotion handlers
  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promotionFormData.name || !promotionFormData.discount_percentage || !promotionFormData.start_date || !promotionFormData.end_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const payload = {
        name: promotionFormData.name,
        description: promotionFormData.description || null,
        discount_percentage: parseFloat(promotionFormData.discount_percentage),
        start_date: promotionFormData.start_date,
        end_date: promotionFormData.end_date,
        created_by: user.id,
        status: "active",
      };

      let promotionId: string;

      if (editingPromotion) {
        const { error } = await supabase
          .from("promotions")
          .update(payload)
          .eq("id", editingPromotion.id);

        if (error) throw error;
        promotionId = editingPromotion.id;
        toast.success(`Promotion "${payload.name}" updated successfully!`);
      } else {
        const { data, error } = await supabase
          .from("promotions")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        promotionId = data.id;
        toast.success(`Promotion "${payload.name}" created successfully!`);
      }

      // Update linked products
      // First delete existing links
      await supabase
        .from("promotion_products")
        .delete()
        .eq("promotion_id", promotionId);

      // Then add new links
      if (selectedProductIds.length > 0) {
        const productLinks = selectedProductIds.map(productId => ({
          promotion_id: promotionId,
          product_id: productId,
        }));

        await supabase.from("promotion_products").insert(productLinks);
      }

      setIsPromotionDialogOpen(false);
      resetPromotionForm();
      fetchPromotions();
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error("Failed to save promotion");
    }
  };

  const handleDeletePromotion = async (promotionId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the promotion: "${name}"?`)) return;

    try {
      // Delete linked products first
      await supabase
        .from("promotion_products")
        .delete()
        .eq("promotion_id", promotionId);

      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", promotionId);

      if (error) throw error;

      toast.success(`Promotion "${name}" deleted successfully!`);
      fetchPromotions();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Failed to delete promotion");
    }
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={signOut} className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Dialog
            open={isCompanyDialogOpen}
            onOpenChange={setIsCompanyDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4">
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Create</span> Company
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
                
                {/* Social Media Links Section */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-semibold">Social Media Links (Optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add company social media links for giveaway entry requirements.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="youtube_url" className="text-xs">YouTube</Label>
                      <Input
                        id="youtube_url"
                        type="url"
                        value={companyFormData.youtube_url}
                        onChange={(e) =>
                          setCompanyFormData({ ...companyFormData, youtube_url: e.target.value })
                        }
                        placeholder="https://youtube.com/@channel"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="instagram_url" className="text-xs">Instagram</Label>
                      <Input
                        id="instagram_url"
                        type="url"
                        value={companyFormData.instagram_url}
                        onChange={(e) =>
                          setCompanyFormData({ ...companyFormData, instagram_url: e.target.value })
                        }
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="twitter_url" className="text-xs">Twitter/X</Label>
                      <Input
                        id="twitter_url"
                        type="url"
                        value={companyFormData.twitter_url}
                        onChange={(e) =>
                          setCompanyFormData({ ...companyFormData, twitter_url: e.target.value })
                        }
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tiktok_url" className="text-xs">TikTok</Label>
                      <Input
                        id="tiktok_url"
                        type="url"
                        value={companyFormData.tiktok_url}
                        onChange={(e) =>
                          setCompanyFormData({ ...companyFormData, tiktok_url: e.target.value })
                        }
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>
                  </div>
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
                size="sm"
                className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4"
                onClick={() => setEditingGiveaway(null)}
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Giveaway
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
                
                {/* Giveaway Requirements Section */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-semibold">Entry Requirements</Label>
                  <p className="text-xs text-muted-foreground">
                    Configure what users must complete to enter this giveaway.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="req_email"
                        checked={giveawayRequirements.require_email_verified}
                        onCheckedChange={(checked) =>
                          setGiveawayRequirements({ ...giveawayRequirements, require_email_verified: !!checked })
                        }
                      />
                      <label htmlFor="req_email" className="text-sm font-medium leading-none">
                        Email Verification Required
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="req_follow"
                        checked={giveawayRequirements.require_company_follow}
                        onCheckedChange={(checked) =>
                          setGiveawayRequirements({ ...giveawayRequirements, require_company_follow: !!checked })
                        }
                      />
                      <label htmlFor="req_follow" className="text-sm font-medium leading-none">
                        Must Follow Company
                      </label>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Social Media Tasks (requires company social links)</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="req_youtube"
                            checked={giveawayRequirements.require_youtube}
                            onCheckedChange={(checked) =>
                              setGiveawayRequirements({ ...giveawayRequirements, require_youtube: !!checked })
                            }
                          />
                          <label htmlFor="req_youtube" className="text-sm leading-none">YouTube</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="req_instagram"
                            checked={giveawayRequirements.require_instagram}
                            onCheckedChange={(checked) =>
                              setGiveawayRequirements({ ...giveawayRequirements, require_instagram: !!checked })
                            }
                          />
                          <label htmlFor="req_instagram" className="text-sm leading-none">Instagram</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="req_twitter"
                            checked={giveawayRequirements.require_twitter}
                            onCheckedChange={(checked) =>
                              setGiveawayRequirements({ ...giveawayRequirements, require_twitter: !!checked })
                            }
                          />
                          <label htmlFor="req_twitter" className="text-sm leading-none">Twitter/X</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="req_tiktok"
                            checked={giveawayRequirements.require_tiktok}
                            onCheckedChange={(checked) =>
                              setGiveawayRequirements({ ...giveawayRequirements, require_tiktok: !!checked })
                            }
                          />
                          <label htmlFor="req_tiktok" className="text-sm leading-none">TikTok</label>
                        </div>
                      </div>
                    </div>
                  </div>
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

          {/* Create Promotion Button */}
          <Dialog
            open={isPromotionDialogOpen}
            onOpenChange={(open) => {
              setIsPromotionDialogOpen(open);
              if (!open) {
                resetPromotionForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4"
                onClick={() => setEditingPromotion(null)}
              >
                <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSavePromotion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="promotion_name">Name *</Label>
                  <Input
                    id="promotion_name"
                    value={promotionFormData.name}
                    onChange={(e) =>
                      setPromotionFormData({
                        ...promotionFormData,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotion_description">Description</Label>
                  <Textarea
                    id="promotion_description"
                    value={promotionFormData.description}
                    onChange={(e) =>
                      setPromotionFormData({
                        ...promotionFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotion_discount">Discount Percentage *</Label>
                  <Input
                    id="promotion_discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={promotionFormData.discount_percentage}
                    onChange={(e) =>
                      setPromotionFormData({
                        ...promotionFormData,
                        discount_percentage: e.target.value,
                      })
                    }
                    placeholder="10"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="promotion_start">Start Date *</Label>
                    <Input
                      id="promotion_start"
                      type="datetime-local"
                      value={promotionFormData.start_date}
                      onChange={(e) =>
                        setPromotionFormData({
                          ...promotionFormData,
                          start_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promotion_end">End Date *</Label>
                    <Input
                      id="promotion_end"
                      type="datetime-local"
                      value={promotionFormData.end_date}
                      onChange={(e) =>
                        setPromotionFormData({
                          ...promotionFormData,
                          end_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Link Products (Optional)</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {products.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No products available. Companies need to create products first.
                      </p>
                    ) : (
                      products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={selectedProductIds.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                          <label
                            htmlFor={`product-${product.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                          >
                            {product.name} - ${product.price.toFixed(2)}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedProductIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedProductIds.length} product(s) selected
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  {editingPromotion ? "Save Changes" : "Create Promotion"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Users</CardTitle>
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Companies</CardTitle>
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalCompanies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Giveaways</CardTitle>
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalGiveaways}</div>
            </CardContent>
          </Card>

          <Card className="hidden lg:block">
            <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Winners</CardTitle>
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalWinners}</div>
            </CardContent>
          </Card>

          <Card className="hidden lg:block">
            <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Promotions</CardTitle>
              <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalPromotions}</div>
            </CardContent>
          </Card>
        </div>
        {/* -------------------------------------------------------------------------- */}

        {/* Giveaways Table (CRUD - R, U, D) */}
        <Card className="mb-4 sm:mb-8">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-lg">All Giveaways</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {loading ? (
              <p className="text-center text-muted-foreground py-4 text-xs sm:text-sm">
                Loading giveaways...
              </p>
            ) : giveaways.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-xs sm:text-sm">
                No giveaways found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] sm:text-xs">Title</TableHead>
                      <TableHead className="text-[10px] sm:text-xs hidden sm:table-cell">Company</TableHead>
                      <TableHead className="text-[10px] sm:text-xs">Entries</TableHead>
                      <TableHead className="text-[10px] sm:text-xs hidden md:table-cell">Prize</TableHead>
                      <TableHead className="text-[10px] sm:text-xs">End</TableHead>
                      <TableHead className="text-[10px] sm:text-xs hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-[10px] sm:text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giveaways.map((giveaway) => (
                      <TableRow key={giveaway.id}>
                        <TableCell className="font-medium text-[10px] sm:text-sm max-w-[80px] sm:max-w-none truncate">
                          {giveaway.title}
                        </TableCell>
                        <TableCell className="text-[10px] sm:text-sm hidden sm:table-cell">{giveaway.company_name}</TableCell>
                        <TableCell className="text-[10px] sm:text-sm">{giveaway.entries_count}</TableCell>
                        <TableCell className="text-[10px] sm:text-sm hidden md:table-cell">
                          {giveaway.prize_value
                            ? `$${giveaway.prize_value.toFixed(0)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-[10px] sm:text-sm">
                          {format(new Date(giveaway.end_date), "MM/dd")}
                        </TableCell>
                        <TableCell className="text-[10px] sm:text-sm hidden lg:table-cell">
                          {format(new Date(giveaway.created_at), "MM/dd")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleEditGiveaway(giveaway)}
                            >
                              <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                              onClick={() =>
                                handleDeleteGiveaway(
                                  giveaway.id,
                                  giveaway.title
                                )
                              }
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

        {/* Promotions Table */}
        <Card className="mb-4 sm:mb-8">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-lg">All Promotions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {loading ? (
              <p className="text-center text-muted-foreground py-4 text-xs sm:text-sm">
                Loading promotions...
              </p>
            ) : promotions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-xs sm:text-sm">
                No promotions found. Click "Promotion" to add one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] sm:text-xs">Name</TableHead>
                      <TableHead className="text-[10px] sm:text-xs">Discount</TableHead>
                      <TableHead className="text-[10px] sm:text-xs hidden sm:table-cell">Start</TableHead>
                      <TableHead className="text-[10px] sm:text-xs">End</TableHead>
                      <TableHead className="text-[10px] sm:text-xs">Status</TableHead>
                      <TableHead className="text-[10px] sm:text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promotion) => {
                      const now = new Date();
                      const startDate = new Date(promotion.start_date);
                      const endDate = new Date(promotion.end_date);
                      const isActive = now >= startDate && now <= endDate && promotion.status === "active";
                      
                      return (
                        <TableRow key={promotion.id}>
                          <TableCell className="font-medium text-[10px] sm:text-sm max-w-[60px] sm:max-w-none truncate">
                            {promotion.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[9px] sm:text-xs px-1 sm:px-2">
                              {promotion.discount_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[10px] sm:text-sm hidden sm:table-cell">
                            {format(new Date(promotion.start_date), "MM/dd")}
                          </TableCell>
                          <TableCell className="text-[10px] sm:text-sm">
                            {format(new Date(promotion.end_date), "MM/dd")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isActive ? "default" : "outline"} className="text-[9px] sm:text-xs px-1 sm:px-2">
                              {isActive ? "Active" : now < startDate ? "Soon" : "End"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                onClick={() => handleEditPromotion(promotion)}
                              >
                                <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                onClick={() =>
                                  handleDeletePromotion(promotion.id, promotion.name)
                                }
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
              {/* Company Logo - Only show for company role */}
              {(userFormData.role === "company" || editingUser?.role === "company") && (
                <div className="space-y-2">
                  <Label htmlFor="user_logo">Company Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="user_logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedUserLogo(file);
                        }
                      }}
                      className="flex-1"
                    />
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {selectedUserLogo && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedUserLogo.name}
                    </p>
                  )}
                  {!selectedUserLogo && userFormData.logo_url && (
                    <p className="text-sm text-muted-foreground">
                      Current logo: {userFormData.logo_url.substring(0, 40)}...
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={uploadingUserLogo}>
                <Save className="w-4 h-4 mr-2" />
                {uploadingUserLogo ? "Saving..." : "Save Changes"}
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
