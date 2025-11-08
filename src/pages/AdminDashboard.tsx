import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogOut, Users, Building2, Gift, Trophy, Plus, UserPlus, Upload } from 'lucide-react';

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
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalGiveaways: 0,
    totalWinners: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isGiveawayDialogOpen, setIsGiveawayDialogOpen] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [giveawayFormData, setGiveawayFormData] = useState({
    company_id: '',
    title: '',
    description: '',
    image_url: '',
    prize_value: '',
    end_date: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCompanies();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user_id to role
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      // Combine profiles with roles
      const usersData = (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || 'N/A',
        role: roleMap.get(profile.id) || 'user',
        created_at: profile.created_at,
      }));

      setUsers(usersData);

      // Calculate stats
      const userCount = usersData.filter((u) => u.role === 'user').length;
      const companyCount = usersData.filter((u) => u.role === 'company').length;

      const { count: giveawayCount } = await supabase
        .from('giveaways')
        .select('*', { count: 'exact', head: true });

      const { count: winnerCount } = await supabase
        .from('winners')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount,
        totalCompanies: companyCount,
        totalGiveaways: giveawayCount || 0,
        totalWinners: winnerCount || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data: companyRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'company');

      if (!companyRoles) return;

      const companyIds = companyRoles.map(r => r.user_id);

      if (companyIds.length === 0) {
        setCompanies([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', companyIds);

      setCompanies(profiles || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      // Call Edge Function to create company with service role
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-company`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: companyFormData.email,
          password: companyFormData.password,
          full_name: companyFormData.full_name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create company account');
      }

      toast.success('Company account created successfully!');
      setIsCompanyDialogOpen(false);
      setCompanyFormData({ email: '', password: '', full_name: '' });
      fetchData();
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create company account');
      console.error(error);
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

    // Validate company selection
    if (!giveawayFormData.company_id) {
      toast.error('Please select a company');
      return;
    }

    try {
      setUploadingImage(true);
      
      let imageUrl = giveawayFormData.image_url;

      // If a file is selected, upload it
      if (selectedImage) {
        const uploadedUrl = await handleImageUpload(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase.from('giveaways').insert({
        company_id: giveawayFormData.company_id,
        title: giveawayFormData.title,
        description: giveawayFormData.description,
        image_url: imageUrl || null,
        prize_value: giveawayFormData.prize_value ? parseFloat(giveawayFormData.prize_value) : null,
        end_date: giveawayFormData.end_date,
      });

      if (error) throw error;

      toast.success('Giveaway created successfully!');
      setIsGiveawayDialogOpen(false);
      setGiveawayFormData({
        company_id: '',
        title: '',
        description: '',
        image_url: '',
        prize_value: '',
        end_date: '',
      });
      setSelectedImage(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to create giveaway');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      // Note: In a production app, you'd want to use an Edge Function for this
      // as deleting auth users requires service role key
      toast.error('User deletion requires admin privileges via backend');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
          <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
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
                    onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_password">Password *</Label>
                  <Input
                    id="company_password"
                    type="password"
                    value={companyFormData.password}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={companyFormData.full_name}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, full_name: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Company
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isGiveawayDialogOpen} onOpenChange={setIsGiveawayDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Create Giveaway
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Giveaway for Company</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGiveaway} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_select">Select Company *</Label>
                  <Select 
                    value={giveawayFormData.company_id} 
                    onValueChange={(value) => setGiveawayFormData({ ...giveawayFormData, company_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No companies available</div>
                      ) : (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.full_name || company.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_title">Title *</Label>
                  <Input
                    id="giveaway_title"
                    value={giveawayFormData.title}
                    onChange={(e) => setGiveawayFormData({ ...giveawayFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_description">Description *</Label>
                  <Textarea
                    id="giveaway_description"
                    value={giveawayFormData.description}
                    onChange={(e) => setGiveawayFormData({ ...giveawayFormData, description: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_image">Image</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="giveaway_image_file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedImage(file);
                            setGiveawayFormData({ ...giveawayFormData, image_url: '' });
                          }
                        }}
                        className="flex-1"
                      />
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">or</div>
                    <Input
                      id="giveaway_image_url"
                      type="url"
                      value={giveawayFormData.image_url}
                      onChange={(e) => {
                        setGiveawayFormData({ ...giveawayFormData, image_url: e.target.value });
                        setSelectedImage(null);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {selectedImage && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedImage.name}
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
                    onChange={(e) => setGiveawayFormData({ ...giveawayFormData, prize_value: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giveaway_end">End Date *</Label>
                  <Input
                    id="giveaway_end"
                    type="datetime-local"
                    value={giveawayFormData.end_date}
                    onChange={(e) => setGiveawayFormData({ ...giveawayFormData, end_date: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : 'Create Giveaway'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
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
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">Total Winners</CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWinners}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading users...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.role !== 'admin' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;