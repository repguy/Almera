import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";

// Pages
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Auth from "@/pages/Auth";
import Checkout from "@/pages/Checkout";
import TrackOrder from "@/pages/TrackOrder";
import Legal from "@/pages/Legal";
import Admin from "@/pages/Admin";
import Account from "@/pages/Account";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/auth" component={Auth} />
      <Route path="/account" component={Account} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/track-order" component={TrackOrder} />
      <Route path="/legal/:slug" component={Legal} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
