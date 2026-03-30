import { Link } from 'wouter';
import { ShoppingBag, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import type { Product } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const discount = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);

  const placeholderImg = `${import.meta.env.BASE_URL}images/product-placeholder.png`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variants && product.variants.length > 0) {
      const v = product.variants[0];
      addItem(product, v.size, v.color);
      toast({
        title: "Added to Bag",
        description: `${product.name} (${v.size}, ${v.color})`,
      });
    } else {
      addItem(product, "Standard", "Default");
      toast({ title: "Added to Bag", description: product.name });
    }
  };

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[3/4] mb-4">
          <img
            src={product.images?.[0] || placeholderImg}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <Badge className="gradient-gold text-primary-foreground text-[10px] font-bold tracking-widest uppercase border-0 shadow-md">
                New
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="text-[10px] font-bold tracking-widest uppercase shadow-md">
                -{discount}%
              </Badge>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="flex gap-2">
              <button
                onClick={handleQuickAdd}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-gold text-primary-foreground text-sm font-semibold tracking-wide shadow-lg hover:brightness-110 transition-all"
              >
                <ShoppingBag size={16} />
                Quick Add
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 px-1">
          <h3 className="text-base font-display font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{formatPrice(product.discountedPrice)}</span>
            {discount > 0 && (
              <span className="text-xs font-medium text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
