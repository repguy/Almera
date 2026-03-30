import { useState } from 'react';
import { useTrackOrder } from '@workspace/api-client-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { PackageSearch, Clock, PackageCheck, Truck } from 'lucide-react';
import { format } from 'date-fns';

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [searchParams, setSearchParams] = useState({ orderNumber: '', phone: '' });

  // Only run query if we have both fields (or either, based on API)
  const shouldSearch = Boolean(searchParams.orderNumber || searchParams.phone);
  
  const { data: order, isLoading, isError } = useTrackOrder(
    { orderNumber: searchParams.orderNumber, phone: searchParams.phone },
    { query: { enabled: shouldSearch, retry: false } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ orderNumber, phone });
  };

  const formatPrice = (p: number) => `Rs. ${p.toLocaleString()}`;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'processing': return <PackageSearch className="w-8 h-8 text-blue-500" />;
      case 'shipped': return <Truck className="w-8 h-8 text-primary" />;
      case 'delivered': return <PackageCheck className="w-8 h-8 text-green-500" />;
      default: return <Clock className="w-8 h-8 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your order details to see the current status</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Order Number</Label>
              <Input 
                value={orderNumber} onChange={e => setOrderNumber(e.target.value)} 
                placeholder="e.g. ALM-10294" className="h-12 rounded-xl"
              />
            </div>
            <div className="w-full space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Phone Number</Label>
              <Input 
                value={phone} onChange={e => setPhone(e.target.value)} 
                placeholder="e.g. 03001234567" className="h-12 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto h-12 px-8 rounded-xl gradient-gold font-bold" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Track'}
            </Button>
          </form>
        </div>

        {isError && shouldSearch && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 bg-destructive/10 rounded-2xl text-destructive font-medium border border-destructive/20">
            Order not found. Please check your details and try again.
          </motion.div>
        )}

        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg shadow-black/5">
            <div className="p-8 border-b border-border bg-muted/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Order {order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">Placed on {format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                </div>
                <div className="flex items-center gap-4 bg-background px-6 py-4 rounded-2xl border border-border shadow-sm">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                    <p className="text-xl font-display font-bold text-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h3 className="font-bold uppercase tracking-wider text-sm mb-6">Items in this order</h3>
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center p-4 rounded-xl border border-border bg-background">
                    <div className="w-16 h-16 rounded-md bg-muted overflow-hidden">
                      <img src={item.productImage || '/images/product-placeholder.png'} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.size} · {item.color} × {item.quantity}</p>
                    </div>
                    <p className="font-bold text-foreground">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border flex flex-col items-end gap-2">
                <div className="w-full max-w-xs flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="w-full max-w-xs flex justify-between text-sm text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
                <div className="w-full max-w-xs flex justify-between text-lg font-bold text-foreground pt-4 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
