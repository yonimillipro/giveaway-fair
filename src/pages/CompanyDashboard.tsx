import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Users,
  Gift,
  Package,
  Trash2,
  Star,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { GiveawayCard } from "../components/GiveawayCard";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";
import { ImageUpload } from "../components/ImageUpload";
import { NotificationBell } from "../components/NotificationBell";
import { useNotificationToasts } from "@/hooks/useNotificationToasts";

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  status: string;
  entries_count?: number;
  company_logo?: string;
  company_name?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: string;
  created_at: string;
}

interface Influencer {
  id: string;
  name: string;
  profile_image_url: string | null;
  amount_of_followers: number;
  primary_platform: string;
  social_handle: string | null;
}

const getInfluencerPlatformUrl = (platform: string, handle: string | null): string | null => {
  if (!handle) return null;
  const cleanHandle = handle.replace(/^@/, "");
  const platformLower = platform.toLowerCase();
  if (platformLower === "tiktok") return `https://www.tiktok.com/@${cleanHandle}`;
  if (platformLower === "youtube") return `https://www.youtube.com/@${cleanHandle}`;
  if (platformLower === "instagram") return `https://www.instagram.com/${cleanHandle}`;
  if (platformLower === "twitter" || platformLower === "x") return `https://x.com/${cleanHandle}`;
  return null;
};

const CompanyDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Enable real-time notification toasts
  useNotificationToasts();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [influencersLoading, setInfluencersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<{ logo_url?: string; full_name?: string } | null>(null);
  const [giveawayDialogOpen, setGiveawayDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [newGiveaway, setNewGiveaway] = useState({
    title: "",
    description: "",
    endDate: "",
    prizeValue: 0,
    imageUrl: "",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
  });

  useEffect(() => {
    if (user) {
      fetchCompanyProfile();
      fetchGiveaways();
      fetchProducts();
      fetchInfluencers();
    }
  }, [user]);

  const fetchInfluencers = async () => {
    setInfluencersLoading(true);
    const { data } = await supabase
      .from("influencers")
      .select("id, name, profile_image_url, amount_of_followers, primary_platform, social_handle")
      .order("amount_of_followers", { ascending: false })
      .limit(50);
    setInfluencers(data || []);
    setInfluencersLoading(false);
  };

  const fetchCompanyProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("logo_url, full_name")
      .eq("id", user.id)
      .single();
    setCompanyProfile(data);
  };

  const fetchGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .eq("company_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching giveaways:", error);
      } else {
        // Use RPC to get accurate entry counts (bypasses RLS)
        const processedData = await Promise.all(
          (data || []).map(async (g) => {
            const { data: entryCount } = await supabase
              .rpc('get_giveaway_entry_count', { giveaway_uuid: g.id });
            return {
              ...g,
              entries_count: entryCount || 0,
              company_logo: companyProfile?.logo_url,
              company_name: companyProfile?.full_name,
            };
          })
        );
        setGiveaways(processedData);
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

  const handleCreateGiveaway = async () => {
    if (
      !newGiveaway.title ||
      !newGiveaway.description ||
      !newGiveaway.endDate
    ) {
      toast.error("Please fill in all required giveaway fields.");
      return;
    }

    try {
      const { error } = await supabase.from("giveaways").insert({
        company_id: user?.id,
        title: newGiveaway.title,
        description: newGiveaway.description,
        end_date: newGiveaway.endDate,
        prize_value: newGiveaway.prizeValue,
        image_url: newGiveaway.imageUrl || null,
        status: "active",
      });

      if (error) {
        toast.error("Failed to create giveaway.");
        console.error("Error creating giveaway:", error);
      } else {
        toast.success("Giveaway created successfully!");
        setNewGiveaway({
          title: "",
          description: "",
          endDate: "",
          prizeValue: 0,
          imageUrl: "",
        });
        setGiveawayDialogOpen(false);
        fetchGiveaways();
      }
    } catch (error) {
      console.error(
        "An unexpected error occurred during giveaway creation:",
        error
      );
      toast.error("An unexpected error occurred.");
    }
  };

  const handleDeleteGiveaway = async (id: string) => {
    console.warn("Confirm delete operation for giveaway:", id);
    try {
      const { error } = await supabase.from("giveaways").delete().eq("id", id);

      if (error) {
        toast.error("Failed to delete giveaway.");
        console.error("Error deleting giveaway:", error);
      } else {
        toast.success("Giveaway deleted successfully!");
        fetchGiveaways();
      }
    } catch (error) {
      console.error(
        "An unexpected error occurred during giveaway deletion:",
        error
      );
      toast.error("An unexpected error occurred.");
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error("Please fill in all required product fields.");
      return;
    }

    try {
      const { error } = await supabase.from("products").insert({
        company_id: user?.id,
        name: newProduct.name,
        description: newProduct.description || null,
        price: newProduct.price,
        image_url: newProduct.imageUrl || null,
        status: "active",
      });

      if (error) {
        toast.error("Failed to create product.");
        console.error("Error creating product:", error);
      } else {
        toast.success("Product created successfully!");
        setNewProduct({ name: "", description: "", price: 0, imageUrl: "" });
        setProductDialogOpen(false);
        fetchProducts();
      }
    } catch (error) {
      console.error(
        "An unexpected error occurred during product creation:",
        error
      );
      toast.error("An unexpected error occurred.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    console.warn("Confirm delete operation for product:", id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        toast.error("Failed to delete product.");
        console.error("Error deleting product:", error);
      } else {
        toast.success("Product deleted successfully!");
        fetchProducts();
      }
    } catch (error) {
      console.error(
        "An unexpected error occurred during product deletion:",
        error
      );
      toast.error("An unexpected error occurred.");
    }
  };

  const handleGiveawayView = (id: string) => {
    navigate(`/giveaway/${id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activeGiveaways = giveaways.filter((g) => g.status === "active").length;
  const totalEntries = giveaways.reduce(
    (acc, g) => acc + (g.entries_count || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-primary">
            Company Dashboard
          </h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <ThemeToggle />
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={() => navigate("/company-status")} className="text-xs sm:text-sm px-2 sm:px-3">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Status</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-3">
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
          <Card className="shadow-lg border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">
                Active Giveaways
              </CardTitle>
              <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{activeGiveaways}</div>
              <p className="text-[8px] sm:text-xs text-muted-foreground hidden sm:block">
                Total active campaigns
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">
                Total Entries
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{totalEntries}</div>
              <p className="text-[8px] sm:text-xs text-muted-foreground hidden sm:block">
                Entries across all giveaways
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">
                Products
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{products.length}</div>
              <p className="text-[8px] sm:text-xs text-muted-foreground hidden sm:block">
                Items for prizes
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="giveaways" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:max-w-lg h-8 sm:h-10">
            <TabsTrigger value="giveaways" className="text-xs sm:text-sm">
              Giveaways ({giveaways.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm">
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="influencers" className="text-xs sm:text-sm">
              <Star className="w-3 h-3 mr-1" />
              Influencers
            </TabsTrigger>
          </TabsList>

          {/* Giveaways Tab */}
          <TabsContent value="giveaways" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
                <CardTitle className="text-base sm:text-2xl">Your Giveaways</CardTitle>
                <Dialog open={giveawayDialogOpen} onOpenChange={setGiveawayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Create New Giveaway</span>
                      <span className="sm:hidden">Create</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Giveaway</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newGiveaway.title}
                          onChange={(e) =>
                            setNewGiveaway({
                              ...newGiveaway,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newGiveaway.description}
                          onChange={(e) =>
                            setNewGiveaway({
                              ...newGiveaway,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={newGiveaway.endDate}
                          onChange={(e) =>
                            setNewGiveaway({
                              ...newGiveaway,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prize_value">Prize Value ($)</Label>
                        <Input
                          id="prize_value"
                          type="number"
                          value={newGiveaway.prizeValue}
                          onChange={(e) =>
                            setNewGiveaway({
                              ...newGiveaway,
                              prizeValue: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <ImageUpload
                        bucket="giveaway-images"
                        folder="giveaways"
                        currentUrl={newGiveaway.imageUrl}
                        onUrlChange={(url) =>
                          setNewGiveaway({ ...newGiveaway, imageUrl: url })
                        }
                        label="Giveaway Image"
                        urlLabel="Or enter image URL (Optional)"
                      />
                    </div>
                    <Button onClick={handleCreateGiveaway}>
                      <Gift className="w-4 h-4 mr-2" />
                      Publish Giveaway
                    </Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                {loading ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Loading giveaways...
                    </p>
                  </div>
                ) : giveaways.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Gift className="w-10 h-10 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-2 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      You haven't created any giveaways yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                    {giveaways.map((giveaway) => (
                      <div key={giveaway.id}>
                        <GiveawayCard
                          id={giveaway.id}
                          title={giveaway.title}
                          description={giveaway.description}
                          imageUrl={giveaway.image_url || undefined}
                          prizeValue={giveaway.prize_value || undefined}
                          endDate={giveaway.end_date}
                          entriesCount={giveaway.entries_count}
                          companyLogo={giveaway.company_logo}
                          companyName={giveaway.company_name}
                          onView={handleGiveawayView}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGiveaway(giveaway.id);
                          }}
                          className="w-full mt-1 sm:mt-2 text-xs sm:text-sm h-7 sm:h-9"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
                <CardTitle className="text-base sm:text-2xl">Your Products</CardTitle>
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Add New Product</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input
                          id="product-name"
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-description">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="product-description"
                          value={newProduct.description || ""}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-price">Price ($)</Label>
                        <Input
                          id="product-price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <ImageUpload
                        bucket="giveaway-images"
                        folder="products"
                        currentUrl={newProduct.imageUrl}
                        onUrlChange={(url) =>
                          setNewProduct({ ...newProduct, imageUrl: url })
                        }
                        label="Product Image"
                        urlLabel="Or enter image URL (Optional)"
                      />
                    </div>
                    <Button onClick={handleCreateProduct}>
                      <Package className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                {products.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="w-10 h-10 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-2 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      You haven't listed any products yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className="overflow-hidden shadow-md"
                      >
                        <div className="aspect-square w-full overflow-hidden bg-muted">
                          <img
                            src={
                              product.image_url ||
                              `https://placehold.co/400x400/1e293b/ffffff?text=Product+${product.id}`
                            }
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = `https://placehold.co/400x400/1e293b/ffffff?text=Product+${product.id}`;
                            }}
                          />
                        </div>
                        <CardHeader className="p-2 sm:p-4">
                          <CardTitle className="text-xs sm:text-lg line-clamp-1">
                            {product.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-4 pt-0 space-y-2 sm:space-y-4">
                          {product.description && (
                            <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-2xl font-bold text-primary">
                              ${product.price.toFixed(2)}
                            </span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Influencers Tab */}
          <TabsContent value="influencers" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-2xl flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Top Influencers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                {influencersLoading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Loading influencers...</p>
                  </div>
                ) : influencers.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No influencers available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {influencers.map((inf) => {
                      const platformUrl = getInfluencerPlatformUrl(inf.primary_platform, inf.social_handle);
                      const isClickable = !!platformUrl;

                      const cardContent = (
                        <Card
                          className={cn(
                            "overflow-hidden transition-all duration-200",
                            isClickable
                              ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                              : "opacity-80"
                          )}
                        >
                          <div className="aspect-square w-full overflow-hidden bg-muted flex items-center justify-center relative">
                            {inf.profile_image_url ? (
                              <img
                                src={inf.profile_image_url}
                                alt={inf.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.style.display = "none";
                                }}
                              />
                            ) : (
                              <Star className="w-10 h-10 text-muted-foreground/30" />
                            )}
                            {isClickable && (
                              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-2 sm:p-3">
                            <h3 className="font-semibold text-xs sm:text-sm truncate">{inf.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {inf.amount_of_followers >= 1_000_000
                                ? `${(inf.amount_of_followers / 1_000_000).toFixed(1)}M`
                                : inf.amount_of_followers >= 1_000
                                ? `${(inf.amount_of_followers / 1_000).toFixed(1)}K`
                                : inf.amount_of_followers}{" "}
                              followers
                            </p>
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {inf.primary_platform}
                            </span>
                          </CardContent>
                        </Card>
                      );

                      if (isClickable) {
                        return (
                          <a
                            key={inf.id}
                            href={platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block min-h-[44px]"
                          >
                            {cardContent}
                          </a>
                        );
                      }

                      return (
                        <Tooltip key={inf.id}>
                          <TooltipTrigger asChild>
                            <div className="min-h-[44px]">{cardContent}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Platform link not available</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CompanyDashboard;
// import { useEffect, useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { supabase } from '@/integrations/supabase/client';
// import { toast } from 'sonner';
// import { LogOut, Plus, Users, Trophy, Gift, Package, Trash2, Upload } from 'lucide-react';
// import { GiveawayCard } from '@/components/GiveawayCard';

// interface Giveaway {
//   id: string;
//   title: string;
//   description: string;
//   image_url: string | null;
//   prize_value: number | null;
//   end_date: string;
//   status: string;
//   entries_count?: number;
// }

// interface Product {
//   id: string;
//   name: string;
//   description: string | null;
//   price: number;
//   image_url: string | null;
//   status: string;
//   created_at: string;
// }

// const CompanyDashboard = () => {
//   const { user, signOut } = useAuth();
//   const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [stats, setStats] = useState({
//     totalGiveaways: 0,
//     activeGiveaways: 0,
//     totalEntries: 0,
//     totalWinners: 0,
//     totalProducts: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     image_url: '',
//     prize_value: '',
//     end_date: '',
//   });
//   const [productFormData, setProductFormData] = useState({
//     name: '',
//     description: '',
//     price: '',
//     image_url: '',
//   });
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [selectedProductImage, setSelectedProductImage] = useState<File | null>(null);
//   const [uploadingImage, setUploadingImage] = useState(false);

//   useEffect(() => {
//     if (user) {
//       fetchMyGiveaways();
//       fetchMyProducts();
//     }
//   }, [user]);

//   const fetchMyGiveaways = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('giveaways')
//         .select('*')
//         .eq('company_id', user?.id)
//         .order('created_at', { ascending: false });

//       if (error) throw error;

//       const giveawaysWithCounts = await Promise.all(
//         (data || []).map(async (giveaway) => {
//           const { count } = await supabase
//             .from('giveaway_entries')
//             .select('*', { count: 'exact', head: true })
//             .eq('giveaway_id', giveaway.id);

//           return {
//             ...giveaway,
//             entries_count: count || 0,
//           };
//         })
//       );

//       // Calculate stats
//       const entriesCount = giveawaysWithCounts.reduce((sum, g) => sum + (g.entries_count || 0), 0);

//       const { count: winnerCount } = await supabase
//         .from('winners')
//         .select('*', { count: 'exact', head: true })
//         .in('giveaway_id', data.map(g => g.id));

//       const { count: productCount } = await supabase
//         .from('products')
//         .select('*', { count: 'exact', head: true })
//         .eq('company_id', user?.id);

//       setStats({
//         totalGiveaways: data.length,
//         activeGiveaways: data.filter((g: Giveaway) => g.status === 'active').length,
//         totalEntries: entriesCount,
//         totalWinners: winnerCount || 0,
//         totalProducts: productCount || 0,
//       });

//       setGiveaways(giveawaysWithCounts);
//     } catch (error) {
//       console.error('Error fetching giveaways:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchMyProducts = async () => {
//     if (!user) return;

//     try {
//       const { data, error } = await supabase
//         .from('products')
//         .select('*')
//         .eq('company_id', user.id)
//         .order('created_at', { ascending: false});

//       if (error) throw error;
//       setProducts(data || []);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       toast.error('Failed to load products');
//     }
//   };

//   const handleImageUpload = async (file: File): Promise<string | null> => {
//     try {
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
//       const filePath = fileName;

//       const { error: uploadError } = await supabase.storage
//         .from('giveaway-images')
//         .upload(filePath, file);

//       if (uploadError) throw uploadError;

//       const { data: { publicUrl } } = supabase.storage
//         .from('giveaway-images')
//         .getPublicUrl(filePath);

//       return publicUrl;
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       toast.error('Failed to upload image');
//       return null;
//     }
//   };

//   const handleCreateGiveaway = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!user) return;

//     try {
//       setUploadingImage(true);

//       let imageUrl = formData.image_url;

//       if (selectedImage) {
//         const uploadedUrl = await handleImageUpload(selectedImage);
//         if (uploadedUrl) {
//           imageUrl = uploadedUrl;
//         }
//       }

//       const { error } = await supabase.from('giveaways').insert({
//         company_id: user.id,
//         title: formData.title,
//         description: formData.description,
//         image_url: imageUrl || null,
//         prize_value: formData.prize_value ? parseFloat(formData.prize_value) : null,
//         end_date: formData.end_date,
//       });

//       if (error) throw error;

//       toast.success('Giveaway created successfully!');
//       setIsDialogOpen(false);
//       setFormData({
//         title: '',
//         description: '',
//         image_url: '',
//         prize_value: '',
//         end_date: '',
//       });
//       setSelectedImage(null);
//       fetchMyGiveaways();
//     } catch (error) {
//       toast.error('Failed to create giveaway');
//       console.error(error);
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleCreateProduct = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!user) return;

//     try {
//       setUploadingImage(true);

//       let imageUrl = productFormData.image_url;

//       if (selectedProductImage) {
//         const uploadedUrl = await handleImageUpload(selectedProductImage);
//         if (uploadedUrl) {
//           imageUrl = uploadedUrl;
//         }
//       }

//       const { error } = await supabase.from('products').insert({
//         company_id: user.id,
//         name: productFormData.name,
//         description: productFormData.description || null,
//         price: parseFloat(productFormData.price),
//         image_url: imageUrl || null,
//       });

//       if (error) throw error;

//       toast.success('Product added successfully!');
//       setIsProductDialogOpen(false);
//       setProductFormData({
//         name: '',
//         description: '',
//         price: '',
//         image_url: '',
//       });
//       setSelectedProductImage(null);
//       fetchMyProducts();
//       fetchMyGiveaways();
//     } catch (error) {
//       toast.error('Failed to add product');
//       console.error(error);
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleDeleteProduct = async (productId: string) => {
//     if (!confirm('Are you sure you want to delete this product?')) return;

//     try {
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId);

//       if (error) throw error;

//       toast.success('Product deleted successfully');
//       fetchMyProducts();
//       fetchMyGiveaways();
//     } catch (error) {
//       toast.error('Failed to delete product');
//       console.error(error);
//     }
//   };

//   const handleSelectWinner = async (giveawayId: string) => {
//     try {
//       const { data: entries, error: entriesError } = await supabase
//         .from('giveaway_entries')
//         .select(`
//           user_id,
//           profiles!inner(full_name, email)
//         `)
//         .eq('giveaway_id', giveawayId);

//       if (entriesError) throw entriesError;

//       if (!entries || entries.length === 0) {
//         toast.error('No entries found for this giveaway');
//         return;
//       }

//       const randomIndex = Math.floor(Math.random() * entries.length);
//       const winner = entries[randomIndex];

//       const { error: winnerError } = await supabase
//         .from('winners')
//         .insert({
//           giveaway_id: giveawayId,
//           user_id: winner.user_id,
//         });

//       if (winnerError) throw winnerError;

//       await supabase
//         .from('giveaways')
//         .update({ status: 'ended' })
//         .eq('id', giveawayId);

//       const winnerProfile = winner.profiles as any;
//       toast.success(`Winner selected: ${winnerProfile?.full_name || winnerProfile?.email}!`);
//       fetchMyGiveaways();
//     } catch (error: any) {
//       if (error.code === '23505') {
//         toast.error('A winner has already been selected for this giveaway');
//       } else {
//         toast.error('Failed to select winner');
//         console.error(error);
//       }
//     }
//   };

//   const viewWinner = async (giveawayId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from('winners')
//         .select(`
//           user_id,
//           selected_at,
//           profiles!inner(full_name, email)
//         `)
//         .eq('giveaway_id', giveawayId)
//         .single();

//       if (error) throw error;

//       const winnerProfile = data.profiles as any;
//       toast.info(
//         `Winner: ${winnerProfile?.full_name || 'Unknown'} (${winnerProfile?.email})\nSelected: ${new Date(data.selected_at).toLocaleString()}`
//       );
//     } catch (error) {
//       toast.error('Failed to fetch winner details');
//       console.error(error);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold">Company Dashboard</h1>
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
//           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//             <DialogTrigger asChild>
//               <Button>
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create Giveaway
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Create New Giveaway</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateGiveaway} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="title">Title *</Label>
//                   <Input
//                     id="title"
//                     value={formData.title}
//                     onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="description">Description *</Label>
//                   <Textarea
//                     id="description"
//                     value={formData.description}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     required
//                     rows={4}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="image">Image</Label>
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <Input
//                         id="image_file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0];
//                           if (file) {
//                             setSelectedImage(file);
//                             setFormData({ ...formData, image_url: '' });
//                           }
//                         }}
//                         className="flex-1"
//                       />
//                       <Upload className="w-4 h-4 text-muted-foreground" />
//                     </div>
//                     <div className="text-center text-sm text-muted-foreground">or</div>
//                     <Input
//                       id="image_url"
//                       type="url"
//                       value={formData.image_url}
//                       onChange={(e) => {
//                         setFormData({ ...formData, image_url: e.target.value });
//                         setSelectedImage(null);
//                       }}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="prize_value">Prize Value ($)</Label>
//                   <Input
//                     id="prize_value"
//                     type="number"
//                     step="0.01"
//                     value={formData.prize_value}
//                     onChange={(e) => setFormData({ ...formData, prize_value: e.target.value })}
//                     placeholder="100.00"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="end_date">End Date *</Label>
//                   <Input
//                     id="end_date"
//                     type="datetime-local"
//                     value={formData.end_date}
//                     onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <Button type="submit" className="w-full" disabled={uploadingImage}>
//                   {uploadingImage ? 'Uploading...' : 'Create Giveaway'}
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>

//           <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
//             <DialogTrigger asChild>
//               <Button variant="secondary">
//                 <Package className="w-4 h-4 mr-2" />
//                 Add Product
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Add New Product</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreateProduct} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="product_name">Product Name *</Label>
//                   <Input
//                     id="product_name"
//                     value={productFormData.name}
//                     onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="product_description">Description</Label>
//                   <Textarea
//                     id="product_description"
//                     value={productFormData.description}
//                     onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
//                     rows={3}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="product_price">Price ($) *</Label>
//                   <Input
//                     id="product_price"
//                     type="number"
//                     step="0.01"
//                     min="0"
//                     value={productFormData.price}
//                     onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="product_image">Product Image</Label>
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <Input
//                         id="product_image_file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0];
//                           if (file) {
//                             setSelectedProductImage(file);
//                             setProductFormData({ ...productFormData, image_url: '' });
//                           }
//                         }}
//                         className="flex-1"
//                       />
//                       <Upload className="w-4 h-4 text-muted-foreground" />
//                     </div>
//                     <div className="text-center text-sm text-muted-foreground">or</div>
//                     <Input
//                       id="product_image_url"
//                       type="url"
//                       value={productFormData.image_url}
//                       onChange={(e) => {
//                         setProductFormData({ ...productFormData, image_url: e.target.value });
//                         setSelectedProductImage(null);
//                       }}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                 </div>
//                 <Button type="submit" className="w-full" disabled={uploadingImage}>
//                   {uploadingImage ? 'Uploading...' : 'Add Product'}
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Total Giveaways</CardTitle>
//               <Gift className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalGiveaways}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Active</CardTitle>
//               <Gift className="w-4 h-4 text-green-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.activeGiveaways}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
//               <Users className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalEntries}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Winners</CardTitle>
//               <Trophy className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalWinners}</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">Total Products</CardTitle>
//               <Package className="w-4 h-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stats.totalProducts}</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Tabs for Giveaways and Products */}
//         <Tabs defaultValue="giveaways" className="w-full">
//           <TabsList className="grid w-full grid-cols-2 max-w-md">
//             <TabsTrigger value="giveaways">Giveaways</TabsTrigger>
//             <TabsTrigger value="products">Products</TabsTrigger>
//           </TabsList>

//           <TabsContent value="giveaways">
//             <Card>
//               <CardHeader>
//                 <CardTitle>My Giveaways</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {loading ? (
//                   <p className="text-center py-8 text-muted-foreground">Loading...</p>
//                 ) : giveaways.length === 0 ? (
//                   <div className="text-center py-12">
//                     <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
//                     <p className="text-muted-foreground">No giveaways yet. Create one to get started!</p>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {giveaways.map((giveaway) => (
//                       <Card key={giveaway.id} className="overflow-hidden">
//                         <GiveawayCard
//                           {...giveaway}
//                           imageUrl={giveaway.image_url || undefined}
//                           prizeValue={giveaway.prize_value || undefined}
//                           endDate={giveaway.end_date}
//                           entriesCount={giveaway.entries_count}
//                         />
//                         <CardContent className="pt-4">
//                           <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
//                             <Users className="w-4 h-4" />
//                             <span>{giveaway.entries_count} entries</span>
//                           </div>
//                           {giveaway.status === 'active' && new Date(giveaway.end_date) < new Date() && (
//                             <Button
//                               className="w-full"
//                               onClick={() => handleSelectWinner(giveaway.id)}
//                             >
//                               <Trophy className="w-4 h-4 mr-2" />
//                               Select Winner
//                             </Button>
//                           )}
//                           {giveaway.status === 'ended' && (
//                             <Button
//                               variant="secondary"
//                               className="w-full"
//                               onClick={() => viewWinner(giveaway.id)}
//                             >
//                               <Trophy className="w-4 h-4 mr-2" />
//                               View Winner
//                             </Button>
//                           )}
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="products">
//             <Card>
//               <CardHeader>
//                 <CardTitle>My Products</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {loading ? (
//                   <p className="text-center py-8 text-muted-foreground">Loading...</p>
//                 ) : products.length === 0 ? (
//                   <div className="text-center py-12">
//                     <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
//                     <p className="text-muted-foreground">No products yet. Add your first product!</p>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {products.map((product) => (
//                       <Card key={product.id}>
//                         {product.image_url && (
//                           <div className="aspect-video w-full overflow-hidden rounded-t-lg">
//                             <img
//                               src={product.image_url}
//                               alt={product.name}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>
//                         )}
//                         <CardHeader>
//                           <CardTitle className="text-lg">{product.name}</CardTitle>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                           {product.description && (
//                             <p className="text-sm text-muted-foreground line-clamp-2">
//                               {product.description}
//                             </p>
//                           )}
//                           <div className="flex items-center justify-between">
//                             <span className="text-2xl font-bold text-primary">
//                               ${product.price.toFixed(2)}
//                             </span>
//                             <Button
//                               variant="destructive"
//                               size="sm"
//                               onClick={() => handleDeleteProduct(product.id)}
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </Button>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </main>
//     </div>
//   );
// };

// export default CompanyDashboard;
