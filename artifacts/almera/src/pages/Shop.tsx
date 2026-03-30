import { useState } from 'react';
import { useLocation } from 'wouter';
import { useListProducts } from '@workspace/api-client-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';

const categories = [
  { id: 'women', name: 'Women' },
  { id: 'men', name: 'Men' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'footwear', name: 'Footwear' },
];

export default function Shop() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCat = searchParams.get('category') || '';
  
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [sortBy, setSortBy] = useState('featured');

  const { data: products = [], isLoading } = useListProducts({ category: activeCategory || undefined });

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.discountedPrice - b.discountedPrice;
    if (sortBy === 'price-desc') return b.discountedPrice - a.discountedPrice;
    if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Complete Collection</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover pieces that elevate your wardrobe, crafted with precision and deep cultural roots.
          </p>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-border sticky top-20 z-30 bg-background/80 backdrop-blur-md py-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all whitespace-nowrap ${
                !activeCategory 
                  ? 'gradient-gold text-primary-foreground shadow-md' 
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              All Arrivals
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'gradient-gold text-primary-foreground shadow-md' 
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 md:w-48 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            >
              <option value="featured">Featured Picks</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="bg-muted aspect-[3/4] rounded-2xl" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 px-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">No pieces found</h3>
            <p className="text-muted-foreground">We couldn't find anything in this collection right now.</p>
            <button onClick={() => setActiveCategory('')} className="mt-6 text-primary font-medium hover:underline">
              Clear filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {sortedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
      <CartDrawer />
      <WhatsAppWidget />
    </div>
  );
}
