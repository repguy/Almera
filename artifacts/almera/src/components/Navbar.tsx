import { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingBag, Menu, X, Search, User, LogOut, ShieldAlert } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useCart } from '@/context/CartContext';
import { useGetSession, useLogout } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=women', label: 'Women' },
  { href: '/shop?category=men', label: 'Men' },
  { href: '/shop?category=accessories', label: 'Accessories' },
];

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useGetSession();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 -ml-2 text-foreground">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link href="/" className="font-display text-2xl md:text-3xl font-bold tracking-wide text-foreground">
          Almera<span className="text-primary">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wide uppercase"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          
          {session?.isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted">
                  <User size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl p-2">
                <div className="px-2 py-1.5 mb-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{session.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.email}</p>
                </div>
                
                {session.role === 'admin' && (
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer text-sm mb-1">
                      <ShieldAlert size={16} className="mr-2 text-primary" /> Admin Panel
                    </DropdownMenuItem>
                  </Link>
                )}
                
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive text-sm">
                  <LogOut size={16} className="mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth" className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted">
              <User size={20} />
            </Link>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 w-5 h-5 rounded-full gradient-gold flex items-center justify-center text-[10px] font-bold text-primary-foreground border-2 border-background"
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-background/95 backdrop-blur-md"
          >
            <nav className="flex flex-col py-2">
              {navLinks.map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-4 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors tracking-wide uppercase border-b border-border/50 last:border-0"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
