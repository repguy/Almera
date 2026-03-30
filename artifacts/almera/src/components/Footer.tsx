import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h3 className="font-display text-2xl font-bold tracking-wide mb-6">
              Almera<span className="text-primary">.</span>
            </h3>
            <p className="text-sm text-background/70 leading-relaxed max-w-xs">
              Premium Pakistani clothing & accessories. Where tradition meets contemporary elegance in every stitch.
            </p>
          </div>
          
          <div>
            <h4 className="font-display text-base font-semibold tracking-wider uppercase mb-6">Shop</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link href="/shop?category=women" className="hover:text-primary transition-colors">Women's Collection</Link></li>
              <li><Link href="/shop?category=men" className="hover:text-primary transition-colors">Men's Collection</Link></li>
              <li><Link href="/shop?category=accessories" className="hover:text-primary transition-colors">Accessories</Link></li>
              <li><Link href="/shop?category=footwear" className="hover:text-primary transition-colors">Footwear</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-base font-semibold tracking-wider uppercase mb-6">Support</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              <li><Link href="/track-order" className="hover:text-primary transition-colors">Track Order</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-base font-semibold tracking-wider uppercase mb-6">Stay Connected</h4>
            <p className="text-sm text-background/70 mb-4">Subscribe to receive exclusive offers and latest updates.</p>
            <form className="flex" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-l-xl text-sm text-background placeholder:text-background/40 focus:outline-none focus:border-primary transition-colors"
                required
              />
              <button type="submit" className="px-6 py-3 gradient-gold text-primary-foreground text-sm font-medium rounded-r-xl hover:opacity-90 transition-opacity">
                Join
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-background/50">
          <p>© {new Date().getFullYear()} Almera. All rights reserved.</p>
          <p>Crafted with love in Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
