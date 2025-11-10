import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogOut, Plus, Users, Trophy, Gift, Package, Trash2, Upload } from 'lucide-react';
import { GiveawayCard } from '@/components/GiveawayCard';

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  status: string;
  entries_count?: number;
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

const CompanyDashboard = () => {
  const { user, signOut } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalGiveaways: 0,
    activeGiveaways: 0,
    totalEntries: 0,
    totalWinners: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    prize_value: '',
    end_date: '',
  });
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedProductImage, setSelectedProductImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyGiveaways();
      fetchMyProducts();
    }
  }, [user]);

  const fetchMyGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('company_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const giveawaysWithCounts = await Promise.all(
        (data || []).map(async (giveaway) => {
          const { count } = await supabase
            .from('giveaway_entries')
            .select('*', { count: 'exact', head: true })
            .eq('giveaway_id', giveaway.id);

          return {
            ...giveaway,
            entries_count: count || 0,
          };
        })
      );

      // Calculate stats
      const entriesCount = giveawaysWithCounts.reduce((sum, g) => sum + (g.entries_count || 0), 0);
      
      const { count: winnerCount } = await supabase
        .from('winners')
        .select('*', { count: 'exact', head: true })
        .in('giveaway_id', data.map(g => g.id));

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user?.id);

      setStats({
        totalGiveaways: data.length,
        activeGiveaways: data.filter((g: Giveaway) => g.status === 'active').length,
        totalEntries: entriesCount,
        totalWinners: winnerCount || 0,
        totalProducts: productCount || 0,
      });

      setGiveaways(giveawaysWithCounts);
    } catch (error) {
      console.error('Error fetching giveaways:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false});

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('giveaway-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('giveaway-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setUploadingImage(true);
      
      let imageUrl = formData.image_url;

      if (selectedImage) {
        const uploadedUrl = await handleImageUpload(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase.from('giveaways').insert({
        company_id: user.id,
        title: formData.title,
        description: formData.description,
        image_url: imageUrl || null,
        prize_value: formData.prize_value ? parseFloat(formData.prize_value) : null,
        end_date: formData.end_date,
      });

      if (error) throw error;

      toast.success('Giveaway created successfully!');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        prize_value: '',
        end_date: '',
      });
      setSelectedImage(null);
      fetchMyGiveaways();
    } catch (error) {
      toast.error('Failed to create giveaway');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setUploadingImage(true);
      
      let imageUrl = productFormData.image_url;

      if (selectedProductImage) {
        const uploadedUrl = await handleImageUpload(selectedProductImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase.from('products').insert({
        company_id: user.id,
        name: productFormData.name,
        description: productFormData.description || null,
        price: parseFloat(productFormData.price),
        image_url: imageUrl || null,
      });

      if (error) throw error;

      toast.success('Product added successfully!');
      setIsProductDialogOpen(false);
      setProductFormData({
        name: '',
        description: '',
        price: '',
        image_url: '',
      });
      setSelectedProductImage(null);
      fetchMyProducts();
      fetchMyGiveaways();
    } catch (error) {
      toast.error('Failed to add product');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product deleted successfully');
      fetchMyProducts();
      fetchMyGiveaways();
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    }
  };

  const handleSelectWinner = async (giveawayId: string) => {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('giveaway_entries')
        .select(`
          user_id,
          profiles!inner(full_name, email)
        `)
        .eq('giveaway_id', giveawayId);

      if (entriesError) throw entriesError;

      if (!entries || entries.length === 0) {
        toast.error('No entries found for this giveaway');
        return;
      }

      const randomIndex = Math.floor(Math.random() * entries.length);
      const winner = entries[randomIndex];

      const { error: winnerError } = await supabase
        .from('winners')
        .insert({
          giveaway_id: giveawayId,
          user_id: winner.user_id,
        });

      if (winnerError) throw winnerError;

      await supabase
        .from('giveaways')
        .update({ status: 'ended' })
        .eq('id', giveawayId);

      const winnerProfile = winner.profiles as any;
      toast.success(`Winner selected: ${winnerProfile?.full_name || winnerProfile?.email}!`);
      fetchMyGiveaways();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('A winner has already been selected for this giveaway');
      } else {
        toast.error('Failed to select winner');
        console.error(error);
      }
    }
  };

  const viewWinner = async (giveawayId: string) => {
    try {
      const { data, error } = await supabase
        .from('winners')
        .select(`
          user_id,
          selected_at,
          profiles!inner(full_name, email)
        `)
        .eq('giveaway_id', giveawayId)
        .single();

      if (error) throw error;

      const winnerProfile = data.profiles as any;
      toast.info(
        `Winner: ${winnerProfile?.full_name || 'Unknown'} (${winnerProfile?.email})\nSelected: ${new Date(data.selected_at).toLocaleString()}`
      );
    } catch (error) {
      toast.error('Failed to fetch winner details');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Company Dashboard</h1>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Giveaway
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Giveaway</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGiveaway} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="image_file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedImage(file);
                            setFormData({ ...formData, image_url: '' });
                          }
                        }}
                        className="flex-1"
                      />
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">or</div>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setSelectedImage(null);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize_value">Prize Value ($)</Label>
                  <Input
                    id="prize_value"
                    type="number"
                    step="0.01"
                    value={formData.prize_value}
                    onChange={(e) => setFormData({ ...formData, prize_value: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : 'Create Giveaway'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Package className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_description">Description</Label>
                  <Textarea
                    id="product_description"
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_price">Price ($) *</Label>
                  <Input
                    id="product_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_image">Product Image</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="product_image_file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedProductImage(file);
                            setProductFormData({ ...productFormData, image_url: '' });
                          }
                        }}
                        className="flex-1"
                      />
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">or</div>
                    <Input
                      id="product_image_url"
                      type="url"
                      value={productFormData.image_url}
                      onChange={(e) => {
                        setProductFormData({ ...productFormData, image_url: e.target.value });
                        setSelectedProductImage(null);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : 'Add Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Giveaways</CardTitle>
              <Gift className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGiveaways}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Gift className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGiveaways}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Winners</CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWinners}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Giveaways and Products */}
        <Tabs defaultValue="giveaways" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="giveaways">Giveaways</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="giveaways">
            <Card>
              <CardHeader>
                <CardTitle>My Giveaways</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : giveaways.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No giveaways yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {giveaways.map((giveaway) => (
                      <Card key={giveaway.id} className="overflow-hidden">
                        <GiveawayCard
                          {...giveaway}
                          imageUrl={giveaway.image_url || undefined}
                          prizeValue={giveaway.prize_value || undefined}
                          endDate={giveaway.end_date}
                          entriesCount={giveaway.entries_count}
                        />
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Users className="w-4 h-4" />
                            <span>{giveaway.entries_count} entries</span>
                          </div>
                          {giveaway.status === 'active' && new Date(giveaway.end_date) < new Date() && (
                            <Button
                              className="w-full"
                              onClick={() => handleSelectWinner(giveaway.id)}
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              Select Winner
                            </Button>
                          )}
                          {giveaway.status === 'ended' && (
                            <Button
                              variant="secondary"
                              className="w-full"
                              onClick={() => viewWinner(giveaway.id)}
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              View Winner
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>My Products</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No products yet. Add your first product!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Card key={product.id}>
                        {product.image_url && (
                          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-primary">
                              ${product.price.toFixed(2)}
                            </span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </Tabs>
      </main>
    </div>
  );
};

export default CompanyDashboard;