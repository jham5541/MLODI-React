# Google OAuth Setup Guide

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it something like "MLODI Music App"

## 2. Enable Google+ API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity and Access Management (IAM) API"

## 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in app information:
     - App name: "MLODI"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: email, profile, openid
   - Add test users if needed

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "MLODI Web Client"
   - Authorized redirect URIs: 
     - `https://riesezhwmiklpcnrbjkb.supabase.co/auth/v1/callback`

5. For mobile app, also create:
   - Application type: **iOS** (if targeting iOS)
   - Bundle ID: your app's bundle ID (e.g., `com.mlodi.app`)
   
   - Application type: **Android** (if targeting Android)
   - Package name: your app's package name
   - SHA-1 certificate fingerprint: (get from your keystore)

## 4. Configure in Supabase

1. Copy the **Client ID** and **Client Secret** from Google Cloud Console
2. In Supabase Dashboard → Authentication → Providers → Google:
   - Paste Client ID and Client Secret
   - Enable Google provider
   - Save configuration

## 5. Test Configuration

The OAuth flow should now work with the credentials you've set up.
