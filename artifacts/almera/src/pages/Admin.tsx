import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  useGetSession, useLogout,
  useAdminGetExtendedStats,
  useAdminListOrders, useAdminUpdateOrder,
  useGetSettings, useAdminUpdateSettings,
  useAdminListLegalPages, useAdminUpdateLegalPage,
  useAdminListProducts, useAdminCreateProduct, useAdminUpdateProduct, useAdminDeleteProduct,
  useAdminListReviews, useAdminDeleteReview,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Settings, FileText, LogOut, Store,
  Package, Plus, Pencil, Trash2, X, Star, ImagePlus, Eye, TrendingUp, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PIE_COLORS = ['#C9A84C', '#1a1a2e', '#6b7280', '#10b981', '#ef4444'];

export default function Admin() {
  const [, setLocation] = useLocation();
  const { data: session, isLoading } = useGetSession();
  const logout = useLogout();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!session?.isLoggedIn || session.role !== 'admin') {
    setLocation('/');
    return null;
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
        setLocation('/');
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold font-display">A</div>
          <h1 className="font-bold tracking-wider uppercase text-sm">Almera Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setLocation('/')} className="rounded-lg">
            <Store size={14} className="mr-2" /> Storefront
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg">
            <LogOut size={14} className="mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full bg-card border border-border p-1 rounded-2xl mb-8 grid grid-cols-3 sm:grid-cols-6 gap-1">
            {[
              { value: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
              { value: 'orders', icon: ShoppingCart, label: 'Orders' },
              { value: 'products', icon: Package, label: 'Products' },
              { value: 'reviews', icon: Star, label: 'Reviews' },
              { value: 'settings', icon: Settings, label: 'Settings' },
              { value: 'legal', icon: FileText, label: 'Legal' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value} className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs flex items-center gap-1.5 justify-center">
                <Icon size={13} /><span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabsContent value="dashboard" className="mt-0 outline-none"><DashboardTab /></TabsContent>
            <TabsContent value="orders" className="mt-0 outline-none"><OrdersTab /></TabsContent>
            <TabsContent value="products" className="mt-0 outline-none"><ProductsTab /></TabsContent>
            <TabsContent value="reviews" className="mt-0 outline-none"><ReviewsTab /></TabsContent>
            <TabsContent value="settings" className="mt-0 outline-none"><SettingsTab /></TabsContent>
            <TabsContent value="legal" className="mt-0 outline-none"><LegalTab /></TabsContent>
          </motion.div>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data: stats, isLoading } = useAdminGetExtendedStats();

  if (isLoading) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  );

  const cards = [
    { label: 'Total Orders', value: stats?.totalOrders || 0, sub: `${stats?.deliveredOrders || 0} delivered`, color: 'text-foreground', bg: 'bg-foreground/5' },
    { label: 'Total Revenue', value: `Rs. ${((stats?.totalRevenue || 0)).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, sub: 'All non-cancelled', color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Est. Profit', value: `Rs. ${((stats?.totalProfit || 0)).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, sub: '~30% margin est.', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
    { label: 'Pending', value: stats?.pendingOrders || 0, sub: `${stats?.processingOrders || 0} processing`, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
  ];

  const revenueData = (stats?.revenueByDay || []).map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`${c.bg} rounded-2xl p-5 border border-border/60`}>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{c.label}</p>
            <p className={`text-2xl font-display font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-primary" />
          <h3 className="font-bold">Revenue (Last 30 Days)</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => [`Rs. ${Number(v).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
            <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2.5} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Status Pie */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="font-bold">Order Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats?.statusBreakdown?.filter(s => s.count > 0) || []} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="status" label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(stats?.statusBreakdown || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Best Sellers */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Package size={18} className="text-primary" />
            <h3 className="font-bold">Best Sellers</h3>
          </div>
          {!stats?.bestSellers?.length ? (
            <p className="text-muted-foreground text-sm text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.bestSellers.map((b, i) => (
                <div key={b.productId} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{b.productName}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(b.totalSold / (stats.bestSellers[0]?.totalSold || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold">{b.totalSold} sold</p>
                    <p className="text-xs text-muted-foreground">Rs. {b.totalRevenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const { data: ordersData, isLoading } = useAdminListOrders({ limit: 100 });
  const updateOrder = useAdminUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [proofModal, setProofModal] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const orders = ordersData?.data || [];

  const handleStatusChange = (id: string, newStatus: string) => {
    updateOrder.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: 'Status updated' });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      }
    });
  };

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600', processing: 'text-blue-600',
    shipped: 'text-purple-600', delivered: 'text-green-600', cancelled: 'text-red-500',
  };

  return (
    <>
      {/* Payment proof modal */}
      {proofModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
          <div className="bg-card rounded-2xl p-4 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Payment Proof</h3>
              <button onClick={() => setProofModal(null)}><X size={20} /></button>
            </div>
            <img src={proofModal} alt="Payment proof" className="w-full rounded-xl object-contain max-h-[70vh]" />
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Method</th>
                <th className="px-5 py-4">Proof</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-mono font-bold text-xs">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-PK')}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{o.shippingCity}</p>
                  </td>
                  <td className="px-5 py-4 font-bold">Rs.&nbsp;{o.total.toLocaleString()}</td>
                  <td className="px-5 py-4 uppercase text-xs font-bold">{o.paymentMethod}</td>
                  <td className="px-5 py-4">
                    {o.paymentScreenshotUrl ? (
                      <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => setProofModal(o.paymentScreenshotUrl!)}>
                        <Eye size={12} className="mr-1" /> View
                      </Button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Select value={o.paymentStatus} onValueChange={(val) => updateOrder.mutate({ id: o.id, data: { paymentStatus: val } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] }) })}>
                      <SelectTrigger className="w-[130px] h-8 text-xs font-bold uppercase rounded-lg bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pending" className="text-xs font-bold">Pending</SelectItem>
                        <SelectItem value="confirmed" className="text-xs font-bold">Confirmed</SelectItem>
                        <SelectItem value="failed" className="text-xs font-bold">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-5 py-4">
                    <Select value={o.status} onValueChange={(val) => handleStatusChange(o.id, val)}>
                      <SelectTrigger className={`w-[130px] h-8 text-xs font-bold uppercase rounded-lg bg-background ${statusColors[o.status] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pending" className="text-xs font-bold">Pending</SelectItem>
                        <SelectItem value="processing" className="text-xs font-bold">Processing</SelectItem>
                        <SelectItem value="shipped" className="text-xs font-bold">Shipped</SelectItem>
                        <SelectItem value="delivered" className="text-xs font-bold">Delivered</SelectItem>
                        <SelectItem value="cancelled" className="text-xs font-bold">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
const emptyProduct = {
  name: '', slug: '', description: '', category: 'women',
  originalPrice: '', discountedPrice: '', isFeatured: false, isNew: false,
  images: [] as string[], videos: [] as string[],
  variants: [{ size: 'M', color: 'Black', quality: 'Premium', stock: 10 }],
};

function ProductsTab() {
  const { data: products, isLoading } = useAdminListProducts();
  const createProduct = useAdminCreateProduct();
  const updateProduct = useAdminUpdateProduct();
  const deleteProduct = useAdminDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openNew = () => { setForm({ ...emptyProduct, variants: [{ size: 'M', color: 'Black', quality: 'Premium', stock: 10 }] }); setEditId(null); setShowForm(true); };
  const openEdit = (p: any) => {
    setForm({
      name: p.name, slug: p.slug, description: p.description, category: p.category,
      originalPrice: String(p.originalPrice), discountedPrice: String(p.discountedPrice),
      isFeatured: p.isFeatured, isNew: p.isNew,
      images: p.images || [], videos: p.videos || [],
      variants: p.variants?.length ? p.variants : [{ size: 'M', color: 'Black', quality: 'Premium', stock: 10 }],
    });
    setEditId(p.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload/product-image', { method: 'POST', body: fd });
      const data = await res.json();
      setForm(f => ({ ...f, images: [...f.images, data.url] }));
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { size: '', color: '', quality: 'Standard', stock: 0 }] }));
  const updateVariant = (idx: number, key: string, val: any) =>
    setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === idx ? { ...v, [key]: key === 'stock' ? parseInt(val) || 0 : val } : v) }));
  const removeVariant = (idx: number) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      originalPrice: parseFloat(form.originalPrice as string),
      discountedPrice: parseFloat(form.discountedPrice as string),
    };
    const opts = {
      onSuccess: () => {
        toast({ title: editId ? 'Product updated' : 'Product created' });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        closeForm();
      },
      onError: () => toast({ title: 'Error saving product', variant: 'destructive' }),
    };
    if (editId) updateProduct.mutate({ id: editId, data }, opts);
    else createProduct.mutate({ data }, opts);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Product deleted' });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      }
    });
  };

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (showForm) return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold">{editId ? 'Edit Product' : 'Add New Product'}</h2>
        <button onClick={closeForm}><X size={20} className="text-muted-foreground" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Product Name *</Label>
            <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')})} className="h-12 rounded-xl" placeholder="e.g. Floral Embroidered Kurta" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Slug *</Label>
            <Input required value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="h-12 rounded-xl font-mono text-sm" placeholder="floral-embroidered-kurta" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="footwear">Footwear</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Original Price (Rs.) *</Label>
            <Input required type="number" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} className="h-12 rounded-xl" placeholder="8500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Discounted Price (Rs.) *</Label>
            <Input required type="number" value={form.discountedPrice} onChange={e => setForm({...form, discountedPrice: e.target.value})} className="h-12 rounded-xl" placeholder="5950" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Description *</Label>
            <Textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="min-h-[100px] rounded-xl text-sm" placeholder="Product description…" />
          </div>
        </div>

        {/* Flags */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isNew} onChange={e => setForm({...form, isNew: e.target.checked})} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium">New Arrival</span>
          </label>
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Product Images</Label>
          <div className="flex flex-wrap gap-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            ))}
            <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <ImagePlus size={20} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">{uploading ? '…' : 'Add'}</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Variants</Label>
            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="rounded-lg h-8 text-xs">
              <Plus size={12} className="mr-1" /> Add Variant
            </Button>
          </div>
          <div className="space-y-2">
            {form.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center bg-muted/30 rounded-xl p-3">
                <Input value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} placeholder="Size" className="h-9 rounded-lg text-xs" />
                <Input value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} placeholder="Color" className="h-9 rounded-lg text-xs" />
                <Input value={v.quality} onChange={e => updateVariant(i, 'quality', e.target.value)} placeholder="Quality" className="h-9 rounded-lg text-xs" />
                <Input type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} placeholder="Stock" className="h-9 rounded-lg text-xs" />
                <button type="button" onClick={() => removeVariant(i)} className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
            {form.variants.length === 0 && <p className="text-xs text-muted-foreground pl-1">No variants yet</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="gradient-gold rounded-xl font-bold h-12 px-8">
            {(createProduct.isPending || updateProduct.isPending) ? 'Saving…' : (editId ? 'Update Product' : 'Create Product')}
          </Button>
          <Button type="button" variant="outline" onClick={closeForm} className="rounded-xl h-12">Cancel</Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products?.length || 0} products total</p>
        <Button onClick={openNew} className="gradient-gold rounded-xl font-bold">
          <Plus size={16} className="mr-2" /> Add Product
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Discount</th>
                <th className="px-5 py-4">Flags</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products?.map(p => {
                const discount = Math.round(((p.originalPrice - p.discountedPrice) / p.originalPrice) * 100);
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-bold">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize text-xs font-bold">{p.category}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold">Rs. {p.discountedPrice.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground line-through">Rs. {p.originalPrice.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {p.isFeatured && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Featured</span>}
                        {p.isNew && <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">New</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="rounded-lg h-8 text-xs">
                          <Pencil size={12} className="mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id, p.name)} className="rounded-lg h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!products?.length && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────
function ReviewsTab() {
  const { data: reviews, isLoading } = useAdminListReviews();
  const deleteReview = useAdminDeleteReview();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const handleDelete = (id: string) => {
    if (!confirm('Delete this review?')) return;
    deleteReview.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Review deleted' });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      }
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground tracking-wider">
            <tr>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Author</th>
              <th className="px-5 py-4">Rating</th>
              <th className="px-5 py-4">Review</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews?.map(r => (
              <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-bold text-xs">{r.productName}</p>
                </td>
                <td className="px-5 py-4 font-medium">{r.authorName}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground'} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4 max-w-[200px]">
                  {r.title && <p className="font-bold text-xs mb-0.5">{r.title}</p>}
                  <p className="text-xs text-muted-foreground truncate">{r.body}</p>
                </td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-PK')}</td>
                <td className="px-5 py-4">
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} className="rounded-lg h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {!reviews?.length && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No reviews yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useAdminUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});

  if (settings && Object.keys(form).length === 0) setForm(settings);
  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({ data: form }, {
      onSuccess: () => {
        toast({ title: 'Settings saved' });
        queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      }
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-8 max-w-2xl shadow-sm">
      <h2 className="font-display text-xl font-bold mb-6">Store Settings</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Delivery Fee (Rs.)</Label>
            <Input value={form.delivery_fee || ''} onChange={e => setForm({...form, delivery_fee: e.target.value})} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">COD Fee %</Label>
            <Input value={form.cod_fee_percent || ''} onChange={e => setForm({...form, cod_fee_percent: e.target.value})} className="h-12 rounded-xl" />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Bank Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Bank Name</Label>
            <Input value={form.bank_name || ''} onChange={e => setForm({...form, bank_name: e.target.value})} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Account No.</Label>
            <Input value={form.bank_account || ''} onChange={e => setForm({...form, bank_account: e.target.value})} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Account Title</Label>
            <Input value={form.bank_account_title || ''} onChange={e => setForm({...form, bank_account_title: e.target.value})} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Easypaisa Number</Label>
            <Input value={form.easypaisa_number || ''} onChange={e => setForm({...form, easypaisa_number: e.target.value})} className="h-12 rounded-xl" />
          </div>
        </div>
        <Button type="submit" disabled={updateSettings.isPending} className="h-12 px-8 rounded-xl font-bold gradient-gold text-primary-foreground">
          {updateSettings.isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}

// ─── Legal Tab ────────────────────────────────────────────────────────────────
function LegalTab() {
  const { data: pages, isLoading } = useAdminListLegalPages();
  const updatePage = useAdminUpdateLegalPage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any>(null);

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const handleSave = () => {
    updatePage.mutate({ id: editing.id, data: { title: editing.title, content: editing.content } }, {
      onSuccess: () => {
        toast({ title: 'Page updated' });
        setEditing(null);
        queryClient.invalidateQueries({ queryKey: ['/api/admin/legal'] });
      }
    });
  };

  if (editing) return (
    <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold">Edit: {editing.slug}</h2>
        <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
      </div>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Title</Label>
          <Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="h-12 rounded-xl text-base font-bold" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Content (HTML supported)</Label>
          <Textarea value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} className="min-h-[400px] font-mono text-sm rounded-xl p-4 leading-relaxed" />
        </div>
        <Button onClick={handleSave} disabled={updatePage.isPending} className="h-12 px-8 rounded-xl font-bold gradient-gold text-primary-foreground">
          {updatePage.isPending ? 'Saving…' : 'Save Page'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 max-w-3xl">
      {pages?.map(p => (
        <div key={p.id} className="bg-card rounded-2xl border border-border p-6 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-lg">{p.title}</h3>
            <p className="text-sm font-mono text-muted-foreground mt-0.5">/legal/{p.slug}</p>
          </div>
          <Button variant="outline" onClick={() => setEditing({...p})} className="rounded-xl">Edit Page</Button>
        </div>
      ))}
    </div>
  );
}
