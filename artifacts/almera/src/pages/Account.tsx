import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import {
  useGetSession,
  useGetAccountProfile, useUpdateAccountProfile,
  useGetAccountOrders,
  useListAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress,
  useGetAccountReviews,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import CartDrawer from '@/components/CartDrawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShoppingBag, MapPin, Star, Pencil, Trash2, Plus, X, CheckCircle2, Package, Truck, Clock, ChevronRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};
const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: X,
};

export default function Account() {
  const [, setLocation] = useLocation();
  const { data: session, isLoading } = useGetSession();

  useEffect(() => {
    if (!isLoading && !session?.isLoggedIn) {
      setLocation('/auth');
    }
  }, [session, isLoading]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!session?.isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {session.fullName || session.email || 'My Account'}
              </h1>
              <p className="text-sm text-muted-foreground">{session.email}</p>
            </div>
          </div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="bg-card border border-border p-1 rounded-2xl mb-8 grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="orders" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs gap-1">
                <ShoppingBag size={13} /> Orders
              </TabsTrigger>
              <TabsTrigger value="addresses" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs gap-1">
                <MapPin size={13} /> Addresses
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs gap-1">
                <Star size={13} /> Reviews
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs gap-1">
                <User size={13} /> Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-0 outline-none"><OrdersTab /></TabsContent>
            <TabsContent value="addresses" className="mt-0 outline-none"><AddressesTab /></TabsContent>
            <TabsContent value="reviews" className="mt-0 outline-none"><ReviewsTab /></TabsContent>
            <TabsContent value="profile" className="mt-0 outline-none"><ProfileTab /></TabsContent>
          </Tabs>
        </motion.div>
      </div>
      <Footer />
      <WhatsAppWidget />
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const { data: orders, isLoading } = useGetAccountOrders();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!orders?.length) return (
    <div className="text-center py-16 bg-card rounded-3xl border border-border">
      <ShoppingBag size={48} className="text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-bold text-lg mb-2">No orders yet</h3>
      <p className="text-muted-foreground mb-6">When you place an order it will appear here.</p>
      <Link href="/shop"><Button className="gradient-gold rounded-xl">Start Shopping</Button></Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const StatusIcon = statusIcons[order.status] || Clock;
        const isOpen = expanded === order.id;
        return (
          <motion.div key={order.id} layout className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <button
              className="w-full p-6 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(isOpen ? null : order.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <StatusIcon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground font-mono">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">Rs. {order.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.paymentMethod}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[order.status] || 'bg-muted text-foreground'}`}>
                    {order.status}
                  </span>
                  <ChevronRight size={16} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border px-6 pb-6 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Shipping to</p>
                        <p className="font-medium">{order.shippingAddress}</p>
                        <p className="text-sm text-muted-foreground">{order.shippingCity}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs. {order.subtotal.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>Rs. {order.deliveryFee.toLocaleString()}</span></div>
                          {order.codFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">COD Fee</span><span>Rs. {order.codFee.toLocaleString()}</span></div>}
                          <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>Total</span><span>Rs. {order.total.toLocaleString()}</span></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Items</p>
                    <div className="space-y-3">
                      {((order as any).items || []).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                            {item.productImage && <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.size} · {item.color} · Qty {item.quantity}</p>
                          </div>
                          <p className="font-bold text-sm flex-shrink-0">Rs. {item.totalPrice?.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Addresses Tab ────────────────────────────────────────────────────────────
const emptyAddress = { label: 'Home', recipientName: '', phone: '', address: '', city: '', isDefault: false };

function AddressesTab() {
  const { data: addresses, isLoading } = useListAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyAddress });

  const openNew = () => { setForm({ ...emptyAddress }); setEditingId(null); setShowForm(true); };
  const openEdit = (a: any) => { setForm({ label: a.label, recipientName: a.recipientName, phone: a.phone, address: a.address, city: a.city, isDefault: a.isDefault }); setEditingId(a.id); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const opts = {
      onSuccess: () => {
        toast({ title: editingId ? 'Address updated' : 'Address saved' });
        queryClient.invalidateQueries({ queryKey: ['/api/account/addresses'] });
        closeForm();
      },
      onError: () => toast({ title: 'Error', description: 'Could not save address', variant: 'destructive' }),
    };
    if (editingId) {
      updateAddress.mutate({ id: editingId, data: form }, opts);
    } else {
      createAddress.mutate({ data: form }, opts);
    }
  };

  const handleDelete = (id: string) => {
    deleteAddress.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Address removed' });
        queryClient.invalidateQueries({ queryKey: ['/api/account/addresses'] });
      }
    });
  };

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Saved Addresses</h2>
        {!showForm && (
          <Button onClick={openNew} size="sm" className="gradient-gold rounded-xl font-bold">
            <Plus size={16} className="mr-2" /> Add New
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{editingId ? 'Edit Address' : 'New Address'}</h3>
              <button type="button" onClick={closeForm}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Label</Label>
                <Input value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="Home, Office…" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Recipient Name *</Label>
                <Input required value={form.recipientName} onChange={e => setForm({...form, recipientName: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Phone *</Label>
                <Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="03XX-XXXXXXX" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">City *</Label>
                <Input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Full Address *</Label>
                <Input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street, Area, Landmark" className="h-11 rounded-xl" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="w-4 h-4 accent-primary" />
                <Label htmlFor="isDefault" className="text-sm cursor-pointer">Set as default address</Label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button type="submit" disabled={createAddress.isPending || updateAddress.isPending} className="gradient-gold rounded-xl font-bold">
                {(createAddress.isPending || updateAddress.isPending) ? 'Saving…' : 'Save Address'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} className="rounded-xl">Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!addresses?.length && !showForm && (
        <div className="text-center py-16 bg-card rounded-3xl border border-border">
          <MapPin size={48} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No saved addresses.</p>
        </div>
      )}

      {addresses?.map(a => (
        <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
              <MapPin size={16} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold capitalize">{a.label}</p>
                {a.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Default</span>}
              </div>
              <p className="text-sm text-foreground">{a.recipientName} · {a.phone}</p>
              <p className="text-sm text-muted-foreground">{a.address}, {a.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="rounded-lg h-9">
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)} className="rounded-lg h-9 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={14} />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────
function ReviewsTab() {
  const { data: reviews, isLoading } = useGetAccountReviews();

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!reviews?.length) return (
    <div className="text-center py-16 bg-card rounded-3xl border border-border">
      <Star size={48} className="text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-bold text-lg mb-2">No reviews yet</h3>
      <p className="text-muted-foreground">Share your thoughts on products you have purchased.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {reviews.map(r => (
        <div key={r.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <Link href={`/product/${r.productSlug}`} className="font-bold hover:text-primary transition-colors">{r.productName}</Link>
              {r.title && <p className="text-sm font-medium mt-0.5">{r.title}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < r.rating ? 'fill-primary text-primary' : 'fill-muted text-muted'} />
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
          <p className="text-xs text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { data: profile, isLoading } = useGetAccountProfile();
  const updateProfile = useUpdateAccountProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({ fullName: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (profile && !synced) { setForm(f => ({ ...f, fullName: profile.fullName || '' })); setSynced(true); }
  }, [profile]);

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' }); return;
    }
    const data: any = { fullName: form.fullName };
    if (form.newPassword) { data.currentPassword = form.currentPassword; data.newPassword = form.newPassword; }

    updateProfile.mutate({ data }, {
      onSuccess: () => {
        toast({ title: 'Profile updated' });
        queryClient.invalidateQueries({ queryKey: ['/api/account/me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
        setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      },
      onError: (err: any) => toast({ title: 'Error', description: err?.message || 'Update failed', variant: 'destructive' }),
    });
  };

  return (
    <div className="max-w-md">
      <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
        <h2 className="font-display text-xl font-bold mb-6">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Email</Label>
            <Input value={profile?.email || ''} disabled className="h-12 rounded-xl bg-muted text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
            <Input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Your name" className="h-12 rounded-xl" />
          </div>

          <div className="border-t border-border pt-5 mt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Change Password</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Current Password</Label>
                <Input type="password" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">New Password</Label>
                <Input type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Confirm New Password</Label>
                <Input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={updateProfile.isPending} className="w-full h-12 rounded-xl font-bold gradient-gold text-primary-foreground mt-2">
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}
