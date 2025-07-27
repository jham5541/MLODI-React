import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  cart_id: string
  payment_method: string
  billing_address?: any
  shipping_address?: any
  payment_reference?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    
    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { cart_id, payment_method, billing_address, shipping_address, payment_reference }: CheckoutRequest = await req.json()

    // Get cart and cart items
    const { data: cart, error: cartError } = await supabaseClient
      .from('carts')
      .select('*')
      .eq('id', cart_id)
      .eq('user_id', user.id)
      .single()

    if (cartError || !cart) {
      throw new Error('Cart not found')
    }

    const { data: cartItems, error: cartItemsError } = await supabaseClient
      .from('cart_items')
      .select(`
        *,
        products (*),
        product_variants (*)
      `)
      .eq('cart_id', cart_id)

    if (cartItemsError || !cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Calculate totals
    let subtotal = 0
    for (const item of cartItems) {
      const price = item.product_variants?.price || item.products.price
      subtotal += price * item.quantity
    }

    const taxRate = 0.08 // 8% tax
    const taxAmount = subtotal * taxRate

    // Calculate shipping
    const hasPhysicalItems = cartItems.some(item => item.products.shipping_required)
    const shippingAmount = hasPhysicalItems ? 5.99 : 0

    const totalAmount = subtotal + taxAmount + shippingAmount

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        payment_method,
        payment_status: 'paid', // For demo purposes, assume payment is successful
        payment_reference,
        billing_address,
        shipping_address,
        status: 'processing'
      })
      .select()
      .single()

    if (orderError) {
      throw new Error('Failed to create order: ' + orderError.message)
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_title: item.products.title,
      product_type: item.products.type,
      variant_name: item.product_variants?.name,
      unit_price: item.product_variants?.price || item.products.price,
      quantity: item.quantity,
      total_price: (item.product_variants?.price || item.products.price) * item.quantity,
      download_url: item.products.type !== 'merch' ? item.products.audio_url || item.products.video_url : null,
      download_expires_at: item.products.type !== 'merch' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null // 1 year
    }))

    const { error: orderItemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      throw new Error('Failed to create order items: ' + orderItemsError.message)
    }

    // Update inventory for physical products
    for (const item of cartItems) {
      if (item.products.track_inventory) {
        if (item.variant_id) {
          // Update variant stock
          await supabaseClient
            .from('product_variants')
            .update({ 
              stock_quantity: supabaseClient.sql`stock_quantity - ${item.quantity}` 
            })
            .eq('id', item.variant_id)
        } else {
          // Update product stock
          await supabaseClient
            .from('products')
            .update({ 
              stock_quantity: supabaseClient.sql`stock_quantity - ${item.quantity}` 
            })
            .eq('id', item.product_id)
        }
      }
    }

    // Clear the cart
    await supabaseClient
      .from('cart_items')
      .delete()
      .eq('cart_id', cart_id)

    // The trigger will automatically add digital items to user library

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number: order.order_number,
        total_amount: totalAmount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})