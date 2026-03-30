import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useGetSession, useGetSettings, useCreateOrder, useUploadPaymentScreenshot } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, ArrowLeft, UploadCloud } from 'lucide-react';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  
  const { data: session } = useGetSession();
  const { data: settings } = useGetSettings();
  const createOrder = useCreateOrder();
  const uploadScreenshot = useUploadPaymentScreenshot();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  
  const [form, setForm] = useState({
    name: session?.fullName || '',
    email: session?.email || '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });

  useEffect(() => {
    if (items.length === 0 && !createOrder.isSuccess) {
      setLocation('/shop');
    }
  }, [items, setLocation, createOrder.isSuccess]);

  const deliveryFee = parseInt(settings?.delivery_fee || '200');
  const codFeePercent = parseInt(settings?.cod_fee_percent || '10');
  const codFee = paymentMethod === 'cod' ? Math.round(totalPrice * (codFeePercent / 100)) : 0;
  const grandTotal = totalPrice + deliveryFee + codFee;
  const formatPrice = (p: number) => `Rs. ${p.toLocaleString()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (paymentMethod !== 'cod' && !screenshot) {
      toast({ title: 'Screenshot required', description: 'Please upload payment proof.', variant: 'destructive' });
      return;
    }

    try {
      let screenshotUrl = null;
      if (screenshot) {
        const uploadRes = await uploadScreenshot.mutateAsync({ data: { file: screenshot } });
        screenshotUrl = uploadRes.url;
      }

      await createOrder.mutateAsync({
        data: {
          customerName: form.name,
          customerEmail: form.email || null,
          customerPhone: form.phone,
          shippingAddress: form.address,
          shippingCity: form.city,
          paymentMethod,
          paymentScreenshotUrl: screenshotUrl,
          notes: form.notes,
          items: items.map(i => ({
            productId: i.product.id,
            productName: i.product.name,
            productImage: i.product.images?.[0] || null,
            size: i.selectedSize,
            color: i.selectedColor,
            quantity: i.quantity,
            unitPrice: i.product.discountedPrice,
            totalPrice: i.product.discountedPrice * i.quantity
          }))
        }
      });
      
      clearCart();
      toast({ title: 'Order Placed Successfully!', description: 'Thank you for shopping with us.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to place order', variant: 'destructive' });
    }
  };

  if (createOrder.isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md bg-card p-10 rounded-3xl border border-border shadow-2xl shadow-primary/5">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <ShieldCheck size={40} />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              We've received your order and will begin processing it right away. 
              {createOrder.data?.orderNumber && <><br/><br/><span className="font-bold text-foreground bg-muted px-4 py-2 rounded-lg">Order #: {createOrder.data.orderNumber}</span></>}
            </p>
            <Link href="/shop">
              <Button size="lg" className="w-full rounded-xl gradient-gold">Continue Shopping</Button>
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Shopping
        </Link>
        
        <h1 className="font-display text-4xl font-bold text-foreground mb-10">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
            {/* Contact & Shipping */}
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
                <Truck className="text-primary" /> Shipping Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name *</Label>
                  <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Phone Number *</Label>
                  <Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 rounded-xl bg-background" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Street Address *</Label>
                  <Input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="h-12 rounded-xl bg-background" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">City *</Label>
                  <Input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="h-12 rounded-xl bg-background" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Order Notes (Optional)</Label>
                  <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl bg-background min-h-[100px]" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground mb-6">Payment Method</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                <div className={`border-2 rounded-2xl p-4 flex items-start gap-4 transition-all cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`} onClick={() => setPaymentMethod('cod')}>
                  <RadioGroupItem value="cod" id="cod" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="cod" className="text-base font-bold cursor-pointer">Cash on Delivery</Label>
                    <p className="text-sm text-muted-foreground mt-1">Pay when you receive your order. A {codFeePercent}% COD handling fee applies.</p>
                  </div>
                </div>

                <div className={`border-2 rounded-2xl p-4 flex items-start gap-4 transition-all cursor-pointer ${paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-border'}`} onClick={() => setPaymentMethod('bank')}>
                  <RadioGroupItem value="bank" id="bank" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="bank" className="text-base font-bold cursor-pointer">Bank Transfer / Easypaisa</Label>
                    <p className="text-sm text-muted-foreground mt-1">Transfer directly to our account and upload the screenshot.</p>
                    
                    {paymentMethod === 'bank' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-border/50">
                        <div className="bg-background rounded-xl p-4 mb-4 text-sm font-mono space-y-2">
                          <p><span className="text-muted-foreground">Bank:</span> {settings?.bank_name || 'Standard Bank'}</p>
                          <p><span className="text-muted-foreground">Account:</span> {settings?.bank_account || '1234567890'}</p>
                          <p><span className="text-muted-foreground">Easypaisa:</span> {settings?.easypaisa_number || '0300 1234567'}</p>
                        </div>
                        <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Upload Screenshot *</Label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground font-medium">
                                {screenshot ? screenshot.name : 'Click to upload screenshot'}
                              </p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={e => setScreenshot(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              disabled={createOrder.isPending || uploadScreenshot.isPending}
              className="w-full h-14 rounded-xl gradient-gold text-primary-foreground text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              {createOrder.isPending || uploadScreenshot.isPending ? 'Processing...' : `Place Order • ${formatPrice(grandTotal)}`}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm sticky top-28">
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4">
                    <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img src={item.product.images?.[0] || '/images/product-placeholder.png'} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.selectedSize} · {item.selectedColor}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-semibold text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-sm font-bold text-foreground">{formatPrice(item.product.discountedPrice * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3 pt-6 border-t border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                </div>
                {paymentMethod === 'cod' && (
                  <div className="flex justify-between text-destructive">
                    <span>COD Fee ({codFeePercent}%)</span>
                    <span className="font-medium">+{formatPrice(codFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                  <span className="text-base font-bold uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-display font-bold text-primary">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
