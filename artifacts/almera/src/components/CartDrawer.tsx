import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;
  const placeholderImg = `${import.meta.env.BASE_URL}images/product-placeholder.png`;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-l border-border flex flex-col p-0">
        <div className="p-6 pb-4 border-b border-border">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl flex items-center gap-2">
              <ShoppingBag className="text-primary" /> Shopping Bag ({totalItems})
            </SheetTitle>
          </SheetHeader>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag size={40} strokeWidth={1} />
            </div>
            <p className="text-lg">Your bag is elegantly empty.</p>
            <Link href="/shop" onClick={() => setIsOpen(false)}>
              <Button size="lg" className="gradient-gold text-primary-foreground rounded-xl px-8">
                Discover Collection
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4"
                  >
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.product.images?.[0] || placeholderImg}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <h4 className="font-display font-medium text-foreground truncate">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                          {item.selectedSize} | {item.selectedColor}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-2">
                          {formatPrice(item.product.discountedPrice)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground shadow-sm hover:text-primary transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-medium w-4 text-center text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground shadow-sm hover:text-primary transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t border-border p-6 bg-background">
              <div className="flex justify-between items-center mb-6">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="text-2xl font-display font-bold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/shop" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="lg" className="w-full rounded-xl">
                    Continue
                  </Button>
                </Link>
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                  <Button size="lg" className="w-full rounded-xl gradient-gold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
