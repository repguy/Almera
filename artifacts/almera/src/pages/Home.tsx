import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import ProductCard from '@/components/ProductCard';
import { useListProducts } from '@workspace/api-client-react';

const mockReviews = [
  { id: 1, name: "Zara A.", city: "Lahore", text: "The embroidery details are breathtaking. Absolutely love the quality!", rating: 5 },
  { id: 2, name: "Ayesha M.", city: "Karachi", text: "Fast delivery and the fabric is incredibly soft. My new favorite brand.", rating: 5 },
  { id: 3, name: "Hassan K.", city: "Islamabad", text: "Got the white shalwar kameez. Perfect fit and premium feel.", rating: 4 },
  { id: 4, name: "Fatima R.", city: "Peshawar", text: "Stunning designs! The colors are even better in person.", rating: 5 },
];

export default function Home() {
  const { data: products = [], isLoading } = useListProducts({ featured: true });
  
  const heroImg = `${import.meta.env.BASE_URL}images/hero-fashion.png`;
  const catWomen = `${import.meta.env.BASE_URL}images/cat-women.png`;
  const catMen = `${import.meta.env.BASE_URL}images/cat-men.png`;
  const catAccessories = `${import.meta.env.BASE_URL}images/cat-accessories.png`;
  const catFootwear = `${import.meta.env.BASE_URL}images/cat-footwear.png`;

  const categories = [
    { img: catWomen, label: 'Women', href: '/shop?category=women' },
    { img: catMen, label: 'Men', href: '/shop?category=men' },
    { img: catAccessories, label: 'Accessories', href: '/shop?category=accessories' },
    { img: catFootwear, label: 'Footwear', href: '/shop?category=footwear' },
  ];

  const doubledReviews = [...mockReviews, ...mockReviews, ...mockReviews];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={heroImg} alt="Almera Collection" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent dark:from-black/90 dark:via-black/60" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-10">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-block border border-primary/50 text-primary bg-primary/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-6"
              >
                New Collection
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] text-white mb-6 drop-shadow-lg"
              >
                Where Tradition <br/>
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#F2D0A4]">Meets Elegance</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white/80 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-lg"
              >
                Discover premium Pakistani clothing crafted with love, artistry, and generations of heritage.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/shop">
                  <Button size="lg" className="w-full sm:w-auto gradient-gold text-primary-foreground rounded-full px-8 py-6 text-base font-semibold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    Explore Collection <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
              >
                Curated Categories
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="text-muted-foreground text-lg"
              >
                Find your perfect look for any occasion
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={cat.href} className="group block relative overflow-hidden rounded-2xl aspect-[3/4] shadow-lg">
                    <img
                      src={cat.img}
                      alt={cat.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between">
                      <h3 className="font-display text-2xl font-semibold text-white group-hover:text-primary transition-colors">
                        {cat.label}
                      </h3>
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 bg-card border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
                >
                  Featured Arrivals
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                  className="text-muted-foreground text-lg"
                >
                  The season's most coveted pieces
                </motion.p>
              </div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Link href="/shop">
                  <Button variant="outline" size="lg" className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                    View All Collection
                  </Button>
                </Link>
              </motion.div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="bg-muted aspect-[3/4] rounded-2xl" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                {products.slice(0, 4).map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Reviews Marquee */}
        <section className="py-24 overflow-hidden bg-background">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved Across the Nation
            </h2>
            <p className="text-muted-foreground">Join thousands of happy customers</p>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee hover:[animation-play-state:paused] w-max">
              {doubledReviews.map((review, i) => (
                <div
                  key={`${review.id}-${i}`}
                  className="flex-shrink-0 w-[350px] mx-4 p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={16} className={j < review.rating ? "fill-primary text-primary" : "text-muted"} />
                    ))}
                  </div>
                  <p className="text-foreground text-base leading-relaxed mb-6">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-sm font-bold text-primary-foreground shadow-inner">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{review.name}</p>
                      <p className="text-xs font-medium text-muted-foreground">{review.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppWidget />
    </div>
  );
}
