import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'achievement' | 'tier_upgrade' | 'artist_activity' | 'playlist_invite' | 'nft_sale' | 'new_release';
  userId?: string;
  userIds?: string[];
  artistId?: string;
  title: string;
  message: string;
  data?: any;
  schedule?: string; // ISO date for scheduled notifications
  channels?: ('push' | 'email' | 'in_app')[];
}

interface PushNotificationPayload {
  to: string[];
  sound: string;
  title: string;
  body: string;
  data?: any;
  badge?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const notification: NotificationRequest = await req.json()
    console.log('Dispatching notification:', notification)

    // Determine target users
    let targetUserIds: string[] = []
    
    if (notification.userId) {
      targetUserIds = [notification.userId]
    } else if (notification.userIds) {
      targetUserIds = notification.userIds
    } else if (notification.artistId && notification.type === 'artist_activity') {
      // Get all followers of the artist
      const { data: followers } = await supabase
        .from('user_follows')
        .select('user_id')
        .eq('followed_type', 'artist')
        .eq('followed_id', notification.artistId)

      targetUserIds = followers?.map(f => f.user_id) || []
    }

    if (!targetUserIds.length) {
      throw new Error('No target users specified')
    }

    // Get user notification preferences and push tokens
    const { data: userPreferences } = await supabase
      .from('user_profiles')
      .select('id, notification_preferences, push_token, email')
      .in('id', targetUserIds)

    const channels = notification.channels || ['push', 'in_app']
    const results = {
      in_app: 0,
      push: 0,
      email: 0,
      scheduled: 0,
      errors: []
    }

    // Process each user
    for (const user of userPreferences || []) {
      const preferences = user.notification_preferences || {}
      
      // Check if user wants this type of notification
      if (preferences[notification.type] === false) {
        continue
      }

      try {
        // Create in-app notification
        if (channels.includes('in_app')) {
          const { error: inAppError } = await supabase
            .from('user_notifications')
            .insert({
              user_id: user.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              data: notification.data || {},
              is_read: false,
              created_at: new Date().toISOString()
            })

          if (inAppError) {
            results.errors.push(`In-app notification failed for user ${user.id}: ${inAppError.message}`)
          } else {
            results.in_app++
          }
        }

        // Send push notification
        if (channels.includes('push') && user.push_token) {
          await sendPushNotification({
            to: [user.push_token],
            sound: getNotificationSound(notification.type),
            title: notification.title,
            body: notification.message,
            data: {
              type: notification.type,
              ...notification.data
            },
            badge: await getUnreadNotificationCount(supabase, user.id)
          })
          results.push++
        }

        // Send email notification (for important notifications)
        if (channels.includes('email') && user.email && shouldSendEmail(notification.type)) {
          await sendEmailNotification(user.email, notification)
          results.email++
        }

      } catch (error) {
        results.errors.push(`Notification failed for user ${user.id}: ${error.message}`)
      }
    }

    // Handle scheduled notifications
    if (notification.schedule) {
      const scheduleDate = new Date(notification.schedule)
      if (scheduleDate > new Date()) {
        await supabase
          .from('scheduled_notifications')
          .insert({
            notification_data: notification,
            scheduled_for: scheduleDate.toISOString(),
            status: 'pending'
          })
        results.scheduled++
      }
    }

    // Log notification dispatch for analytics
    await supabase
      .from('notification_logs')
      .insert({
        type: notification.type,
        target_user_count: targetUserIds.length,
        successful_deliveries: results.in_app + results.push + results.email,
        channels_used: channels,
        artist_id: notification.artistId,
        dispatched_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Notification dispatched to ${targetUserIds.length} users`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Notification dispatch error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Send push notification via Expo Push API
async function sendPushNotification(payload: PushNotificationPayload) {
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN')
  
  if (!expoAccessToken) {
    console.warn('No Expo access token configured')
    return
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${expoAccessToken}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Push notification failed: ${error}`)
  }

  return response.json()
}

// Send email notification
async function sendEmailNotification(email: string, notification: NotificationRequest) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  const emailService = Deno.env.get('EMAIL_SERVICE') // 'sendgrid' | 'ses' | etc.
  
  if (!emailService) {
    console.warn('No email service configured')
    return
  }

  // Example with SendGrid
  if (emailService === 'sendgrid') {
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    
    const emailPayload = {
      personalizations: [{
        to: [{ email }],
        subject: notification.title
      }],
      from: { 
        email: 'notifications@m3lodi.com',
        name: 'M3lodi'
      },
      content: [{
        type: 'text/html',
        value: generateEmailTemplate(notification)
      }]
    }

    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })
  }
}

// Get notification sound based on type
function getNotificationSound(type: string): string {
  const soundMap = {
    'achievement': 'achievement.wav',
    'tier_upgrade': 'tier_up.wav',
    'artist_activity': 'new_music.wav',
    'playlist_invite': 'invite.wav',
    'nft_sale': 'sale.wav',
    'new_release': 'new_release.wav'
  }
  
  return soundMap[type] || 'default'
}

// Check if notification type should trigger email
function shouldSendEmail(type: string): boolean {
  const emailTypes = ['tier_upgrade', 'nft_sale', 'playlist_invite']
  return emailTypes.includes(type)
}

// Get unread notification count for badge
async function getUnreadNotificationCount(supabase: any, userId: string): Promise<number> {
  const { count } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  
  return count || 0
}

// Generate email template
function generateEmailTemplate(notification: NotificationRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎵 M3lodi</h1>
                <h2>${notification.title}</h2>
            </div>
            <div class="content">
                <p>${notification.message}</p>
                ${notification.type === 'new_release' ? '<a href="https://m3lodi.com/discover" class="button">Listen Now</a>' : ''}
                ${notification.type === 'nft_sale' ? '<a href="https://m3lodi.com/marketplace" class="button">View Marketplace</a>' : ''}
            </div>
            <div class="footer">
                <p>© 2024 M3lodi. All rights reserved.</p>
                <p><a href="https://m3lodi.com/unsubscribe">Unsubscribe</a> | <a href="https://m3lodi.com/settings">Notification Settings</a></p>
            </div>
        </div>
    </body>
    </html>
  `
}