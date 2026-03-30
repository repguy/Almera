import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetProduct, useGetProductReviews, useCreateProductReview, useGetSession } from '@workspace/api-client-react';
import { useCart } from '@/context/CartContext';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Heart, Star, ChevronLeft, Truck, Shield, RotateCcw, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug || '';
  
  const { data: product, isLoading, isError } = useGetProduct(slug);
  const { data: reviews = [], isLoading: reviewsLoading } = useGetProductReviews(slug);
  const { data: session } = useGetSession();
  const { addItem, setIsOpen } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createReview = useCreateProductReview();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ authorName: session?.fullName || '', rating: 5, title: '', body: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

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
    setIsOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.body.trim() || !reviewForm.authorName.trim()) return;
    createReview.mutate(
      { slug, data: { authorName: reviewForm.authorName, rating: reviewForm.rating, title: reviewForm.title || undefined, body: reviewForm.body } },
      {
        onSuccess: () => {
          toast({ title: 'Review submitted!' });
          setShowReviewForm(false);
          setReviewForm({ authorName: session?.fullName || '', rating: 5, title: '', body: '' });
          queryClient.invalidateQueries({ queryKey: [`/api/products/${slug}/reviews`] });
          queryClient.invalidateQueries({ queryKey: [`/api/products/${slug}`] });
        },
        onError: () => toast({ title: 'Failed to submit review', variant: 'destructive' }),
      }
    );
  };

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;

  const images = product.images?.length ? product.images : [placeholderImg];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Link href="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Images */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted shadow-2xl"
              >
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 z-10 gradient-gold text-primary-foreground font-bold px-3 py-1 text-sm rounded-full shadow-lg">
                    -{discount}%
                  </Badge>
                )}
                {product.isNew && (
                  <Badge className="absolute top-4 right-4 z-10 bg-foreground text-background font-bold px-3 py-1 text-sm rounded-full">
                    New
                  </Badge>
                )}
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = placeholderImg; }}
                />
              </motion.div>
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = placeholderImg; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col gap-6"
            >
              <div>
                <Badge variant="outline" className="mb-3 capitalize rounded-full text-xs font-bold">{product.category}</Badge>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">{product.name}</h1>
                
                {/* Rating from DB */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className={i < Math.round(avgRating) ? 'fill-primary text-primary' : 'text-muted-foreground'} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}

                <div className="flex items-end gap-3">
                  <span className="font-display text-3xl font-bold text-foreground">{formatPrice(product.discountedPrice)}</span>
                  {discount > 0 && (
                    <span className="text-lg text-muted-foreground line-through font-medium">{formatPrice(product.originalPrice)}</span>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">{product.description}</p>

              {/* Size */}
              {sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-bold text-sm uppercase tracking-wider">Size</Label>
                    <span className="text-xs text-muted-foreground font-medium">Selected: {selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedSize === size ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border hover:border-primary/50 hover:bg-muted'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color */}
              {colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-bold text-sm uppercase tracking-wider">Color</Label>
                    <span className="text-xs text-muted-foreground font-medium">Selected: {selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedColor === color ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border hover:border-primary/50 hover:bg-muted'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  className="flex-1 gradient-gold text-primary-foreground rounded-xl font-bold text-base h-14 shadow-lg shadow-primary/20"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="mr-2 w-5 h-5" /> Add to Bag
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 rounded-xl font-bold text-base h-14 border-2"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Truck, label: 'Free Delivery', sub: 'On orders Rs.5000+' },
                  { icon: Shield, label: 'Authentic', sub: '100% genuine' },
                  { icon: RotateCcw, label: 'Easy Returns', sub: '7-day returns' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 text-center">
                    <Icon size={18} className="text-primary" />
                    <div>
                      <p className="text-xs font-bold">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <div className="mt-20 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MessageSquare size={22} className="text-primary" />
                <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>
                {reviews.length > 0 && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">{reviews.length}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowReviewForm(v => !v)}
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </Button>
            </div>

            {/* Review form */}
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm"
              >
                <h3 className="font-bold text-lg mb-4">Share your experience</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Your Name *</Label>
                      <Input
                        required
                        value={reviewForm.authorName}
                        onChange={e => setReviewForm(f => ({ ...f, authorName: e.target.value }))}
                        placeholder="Your name"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Rating *</Label>
                      <div className="flex items-center gap-1 h-11">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                            className="p-1"
                          >
                            <Star size={24} className={n <= reviewForm.rating ? 'fill-primary text-primary' : 'text-muted-foreground'} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Title (optional)</Label>
                    <Input
                      value={reviewForm.title}
                      onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Brief summary of your review"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Review *</Label>
                    <Textarea
                      required
                      value={reviewForm.body}
                      onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                      placeholder="Share your thoughts about this product..."
                      className="min-h-[100px] rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createReview.isPending}
                    className="gradient-gold rounded-xl font-bold h-11 px-8"
                  >
                    {createReview.isPending ? 'Submitting…' : 'Submit Review'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Reviews list */}
            {reviewsLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-2xl">
                <Star size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                          {review.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{review.authorName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={14} className={j < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'} />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="font-bold text-sm mb-1">{review.title}</p>}
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppWidget />
    </div>
  );
}
