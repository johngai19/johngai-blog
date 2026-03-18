import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan

        if (!userId || !plan || session.mode !== 'subscription') break

        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        const firstItem = subscription.items.data[0]
        const periodStart = firstItem?.current_period_start ?? null
        const periodEnd = firstItem?.current_period_end ?? null

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer as string,
          plan,
          status: subscription.status,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        await supabase
          .from('profiles')
          .update({ subscription_tier: plan, updated_at: new Date().toISOString() })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        const updatedItem = subscription.items.data[0]
        const updPeriodStart = updatedItem?.current_period_start ?? null
        const updPeriodEnd = updatedItem?.current_period_end ?? null

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: updPeriodStart ? new Date(updPeriodStart * 1000).toISOString() : null,
            current_period_end: updPeriodEnd ? new Date(updPeriodEnd * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (userId && subscription.status === 'active') {
          const plan = subscription.metadata?.plan
          if (plan) {
            await supabase
              .from('profiles')
              .update({ subscription_tier: plan, updated_at: new Date().toISOString() })
              .eq('id', userId)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (userId) {
          await supabase
            .from('profiles')
            .update({ subscription_tier: 'free', updated_at: new Date().toISOString() })
            .eq('id', userId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const parent = invoice.parent
        const subDetails = parent?.type === 'subscription_details' ? parent.subscription_details : null
        const rawSub = subDetails?.subscription
        const subscriptionId = typeof rawSub === 'string' ? rawSub : rawSub?.id

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}
