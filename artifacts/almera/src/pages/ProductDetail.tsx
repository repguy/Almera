import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetProduct } from '@workspace/api-client-react';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Heart, Star, ChevronLeft, Truck, Shield, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug || '';
  
  const { data: product, isLoading, isError } = useGetProduct(slug);
  const { addItem, setIsOpen } = useCart();
  const { toast } = useToast();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Auto-select first variant on load
  if (product && !selectedSize && product.variants?.length > 0) {
    setSelectedSize(product.variants[0].size);
    setSelectedColor(product.variants[0].color);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-[3/4] rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-8">The item you are looking for does not exist or has been removed.</p>
          <Link href="/shop">
            <Button size="lg" className="gradient-gold">Return to Shop</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sizes = [...new Set(product.variants.map(v => v.size))];
  const colors = [...new Set(product.variants.map(v => v.color))];
  const discount = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);
  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;
  const placeholderImg = `${import.meta.env.BASE_URL}images/product-placeholder.png`;

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedColor);
    toast({ title: 'Added to Bag', description: `${product.name} has been added.` });
  };

  const handleBuyNow = () => {
    addItem(product, selectedSize, selectedColor);
    setIsOpen(true); // Ideally navigate to checkout directly, but opening cart is safer if they want to review
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        
        <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-muted aspect-[4/5] shadow-xl">
              <img 
                src={product.images?.[0] || placeholderImg} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
              {product.isNew && (
                <Badge className="absolute top-6 left-6 px-4 py-1.5 gradient-gold text-primary-foreground border-0 shadow-lg uppercase tracking-widest text-xs font-bold">
                  New Arrival
                </Badge>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1).map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col pt-4">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} className={i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted"} />
                ))}
              </div>
              <span className="text-sm font-medium text-muted-foreground underline decoration-muted-foreground/30 underline-offset-4">
                {product.reviewCount} Reviews
              </span>
            </div>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                {formatPrice(product.discountedPrice)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through mb-1">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge variant="destructive" className="mb-2 text-xs font-bold px-2 py-0.5">
                    Save {discount}%
                  </Badge>
                </>
              )}
            </div>

            <div className="prose prose-sm dark:prose-invert text-muted-foreground mb-10 max-w-none">
              <p className="text-base leading-relaxed">{product.description}</p>
            </div>

            {/* Selectors */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold uppercase tracking-wider text-foreground">Select Size</label>
                  <button className="text-xs font-medium text-primary underline underline-offset-4">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        selectedSize === size 
                          ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                          : 'border-border bg-card text-foreground hover:border-foreground/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mb-10">
                <label className="block text-sm font-semibold uppercase tracking-wider text-foreground mb-3">Select Color</label>
                <div className="flex flex-wrap gap-3">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        selectedColor === color 
                          ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                          : 'border-border bg-card text-foreground hover:border-foreground/50'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button 
                onClick={handleAddToCart} 
                size="lg" 
                variant="outline" 
                className="flex-1 rounded-xl h-14 text-base font-bold border-2 hover:bg-muted"
              >
                <ShoppingBag className="mr-2 h-5 w-5" /> Add to Bag
              </Button>
              <Button 
                onClick={handleBuyNow} 
                size="lg" 
                className="flex-1 rounded-xl h-14 text-base font-bold gradient-gold text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              >
                Buy it Now
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-border">
              {[
                { icon: Truck, title: 'Free Delivery', desc: 'On orders above Rs. 5000' },
                { icon: Shield, title: 'Secure Payment', desc: '100% safe transactions' },
                { icon: RotateCcw, title: 'Easy Returns', desc: '7 days return policy' },
              ].map(feat => (
                <div key={feat.title} className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <feat.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{feat.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppWidget />
    </div>
  );
}
