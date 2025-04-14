// app/cart/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { createSession } from '@/lib/supabase/serverSide';
import { getCart } from '@/actions/cart';
import CartItems from '@/components/cart/CartItems';
import CartSummary from '@/components/cart/CartSummary';

export const metadata = {
  title: 'Shopping Cart | The Magic Resource',
  description: 'View and manage your shopping cart',
};

export default async function CartPage() {
  // Check for authentication
  const supabase = await createSession();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login?redirectTo=/cart');
  }

  // Get cart data
  const cartResult = await getCart();
  const cartData = cartResult.success ? cartResult.data : { items: [], itemCount: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/marketplace" className="text-purple-700 hover:text-purple-900 flex items-center">
          <ArrowLeft className="mr-2" size={16} />
          Continue Shopping
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-purple-900 mb-8">Your Shopping Cart</h1>

      {!cartData || cartData?.items.length === 0 ? (
        // Empty cart state
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <ShoppingBag size={48} className="text-purple-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven&apos;t added any magical items to your cart yet.
          </p>
          <Link
            href="/marketplace"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md inline-block"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        // Cart with items
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Cart Items ({cartData.itemCount})</h2>
              
              <CartItems initialItems={cartData.items} />
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <CartSummary cartData={cartData} />
          </div>
        </div>
      )}
    </div>
  );
}