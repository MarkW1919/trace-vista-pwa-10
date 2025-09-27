import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface ProfileData {
  displayName?: string;
  bio?: string;
  location?: string;
  followerCount?: number;
  verified?: boolean;
  avatar?: string;
}

interface PlatformResult {
  platform: string;
  url: string;
  found: boolean;
  response_time: number;
  profile_data?: ProfileData;
  confidence: number;
}

interface UsernameSearchResult {
  username: string;
  total_platforms: number;
  found_platforms: number;
  platforms: PlatformResult[];
  search_time: number;
  session_id: string;
}

// Popular platforms to check (similar to maigret)
const PLATFORMS = [
  { name: 'GitHub', url: 'https://github.com/{username}', api: 'https://api.github.com/users/{username}' },
  { name: 'Twitter', url: 'https://twitter.com/{username}', check: 'https://twitter.com/{username}' },
  { name: 'Instagram', url: 'https://instagram.com/{username}', check: 'https://instagram.com/{username}' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/{username}', check: 'https://linkedin.com/in/{username}' },
  { name: 'Reddit', url: 'https://reddit.com/user/{username}', api: 'https://reddit.com/user/{username}/about.json' },
  { name: 'Medium', url: 'https://medium.com/@{username}', check: 'https://medium.com/@{username}' },
  { name: 'DeviantArt', url: 'https://{username}.deviantart.com', check: 'https://{username}.deviantart.com' },
  { name: 'Behance', url: 'https://behance.net/{username}', check: 'https://behance.net/{username}' },
  { name: 'Dribbble', url: 'https://dribbble.com/{username}', check: 'https://dribbble.com/{username}' },
  { name: 'YouTube', url: 'https://youtube.com/@{username}', check: 'https://youtube.com/@{username}' },
  { name: 'TikTok', url: 'https://tiktok.com/@{username}', check: 'https://tiktok.com/@{username}' },
  { name: 'Telegram', url: 'https://t.me/{username}', check: 'https://t.me/{username}' },
  { name: 'Discord', url: 'https://discord.com/users/{username}', check: 'https://discord.com/users/{username}' },
  { name: 'Twitch', url: 'https://twitch.tv/{username}', api: 'https://api.twitch.tv/helix/users?login={username}' },
  { name: 'Steam', url: 'https://steamcommunity.com/id/{username}', check: 'https://steamcommunity.com/id/{username}' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/{username}', check: 'https://open.spotify.com/user/{username}' },
  { name: 'Pinterest', url: 'https://pinterest.com/{username}', check: 'https://pinterest.com/{username}' },
  { name: 'Tumblr', url: 'https://{username}.tumblr.com', check: 'https://{username}.tumblr.com' },
  { name: 'Flickr', url: 'https://flickr.com/people/{username}', check: 'https://flickr.com/people/{username}' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{username}', check: 'https://soundcloud.com/{username}' },
  { name: 'Vimeo', url: 'https://vimeo.com/{username}', api: 'https://vimeo.com/api/v2/user/{username}/info.json' },
  { name: 'Patreon', url: 'https://patreon.com/{username}', check: 'https://patreon.com/{username}' },
  { name: 'Keybase', url: 'https://keybase.io/{username}', api: 'https://keybase.io/_/api/1.0/user/lookup.json?username={username}' },
  { name: 'GitLab', url: 'https://gitlab.com/{username}', api: 'https://gitlab.com/api/v4/users?username={username}' },
  { name: 'Bitbucket', url: 'https://bitbucket.org/{username}', api: 'https://api.bitbucket.org/2.0/users/{username}' },
  { name: 'CodePen', url: 'https://codepen.io/{username}', check: 'https://codepen.io/{username}' },
  { name: 'HackerNews', url: 'https://news.ycombinator.com/user?id={username}', check: 'https://news.ycombinator.com/user?id={username}' },
  { name: 'About.me', url: 'https://about.me/{username}', check: 'https://about.me/{username}' },
  { name: 'Linktree', url: 'https://linktr.ee/{username}', check: 'https://linktr.ee/{username}' },
  { name: 'Gravatar', url: 'https://gravatar.com/{username}', check: 'https://gravatar.com/{username}' },
  { name: 'Docker Hub', url: 'https://hub.docker.com/u/{username}', check: 'https://hub.docker.com/u/{username}' }
];

async function checkPlatform(platform: any, username: string): Promise<PlatformResult> {
  const startTime = Date.now();
  const result: PlatformResult = {
    platform: platform.name,
    url: platform.url.replace('{username}', username),
    found: false,
    response_time: 0,
    confidence: 0
  };

  try {
    let checkUrl = platform.api || platform.check || platform.url;
    checkUrl = checkUrl.replace('{username}', username);

    console.log(`Checking ${platform.name}: ${checkUrl}`);

    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    result.response_time = Date.now() - startTime;

    // Different platforms have different success indicators
    if (response.ok) {
      result.found = true;
      result.confidence = 0.8;

      // Try to extract profile data for API endpoints
      if (platform.api && response.headers.get('content-type')?.includes('application/json')) {
        try {
          const data = await response.json();
          result.profile_data = extractProfileData(platform.name, data);
          result.confidence = 0.95; // Higher confidence for API responses
        } catch (e) {
          console.log(`Failed to parse JSON for ${platform.name}:`, e);
        }
      }
    } else if (response.status === 404) {
      result.found = false;
      result.confidence = 0.9; // High confidence that user doesn't exist
    } else {
      result.found = false;
      result.confidence = 0.3; // Low confidence due to unclear response
    }

  } catch (error) {
    console.log(`Error checking ${platform.name}:`, error);
    result.response_time = Date.now() - startTime;
    result.found = false;
    result.confidence = 0.1; // Very low confidence due to error
  }

  return result;
}

function extractProfileData(platformName: string, data: any): ProfileData {
  switch (platformName.toLowerCase()) {
    case 'github':
      return {
        displayName: data.name,
        bio: data.bio,
        location: data.location,
        followerCount: data.followers,
        verified: data.site_admin,
        avatar: data.avatar_url
      };
    
    case 'reddit':
      return {
        displayName: data.data?.subreddit?.display_name_prefixed,
        bio: data.data?.subreddit?.public_description,
        followerCount: data.data?.subreddit?.subscribers,
        verified: data.data?.verified
      };

    case 'gitlab':
      if (Array.isArray(data) && data.length > 0) {
        const user = data[0];
        return {
          displayName: user.name,
          bio: user.bio,
          location: user.location,
          avatar: user.avatar_url
        };
      }
      break;

    case 'bitbucket':
      return {
        displayName: data.display_name,
        bio: data.website,
        location: data.location,
        avatar: data.links?.avatar?.href
      };

    case 'keybase':
      if (data.them && data.them.length > 0) {
        const user = data.them[0];
        return {
          displayName: user.basics?.full_name,
          bio: user.profile?.bio,
          location: user.profile?.location,
          verified: true // Keybase users are verified by nature
        };
      }
      break;

    case 'vimeo':
      return {
        displayName: data.display_name,
        bio: data.bio,
        location: data.location,
        followerCount: data.total_contacts
      };

    default:
      return data || {};
  }
  return {};
}

async function saveResults(sessionId: string, username: string, results: UsernameSearchResult) {
  try {
    // Save main search session
    const { error: sessionError } = await supabase
      .from('search_sessions')
      .insert({
        id: sessionId,
        query: `username:${username}`,
        status: 'completed',
        total_results: results.found_platforms,
        completed_at: new Date().toISOString(),
        search_mode: 'username_osint'
      });

    if (sessionError) {
      console.error('Error saving session:', sessionError);
    }

    // Save individual platform results
    const platformResults = results.platforms
      .filter(p => p.found)
      .map(platform => ({
        session_id: sessionId,
        title: `${username} on ${platform.platform}`,
        snippet: platform.profile_data?.bio || `Found username ${username} on ${platform.platform}`,
        url: platform.url,
        source: `Username OSINT - ${platform.platform}`,
        confidence: platform.confidence,
        response_time: platform.response_time,
        result_hash: `${sessionId}-${platform.platform}-${username}`.toLowerCase()
      }));

    if (platformResults.length > 0) {
      const { error: resultsError } = await supabase
        .from('search_results')
        .insert(platformResults);

      if (resultsError) {
        console.error('Error saving results:', resultsError);
      }
    }

  } catch (error) {
    console.error('Error in saveResults:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, userId } = await req.json();

    if (!username) {
      throw new Error('Username is required');
    }

    const sessionId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`Starting username OSINT for: ${username}`);

    // Check platforms concurrently (in batches to avoid overwhelming)
    const batchSize = 10;
    const results: PlatformResult[] = [];
    
    for (let i = 0; i < PLATFORMS.length; i += batchSize) {
      const batch = PLATFORMS.slice(i, i + batchSize);
      const batchPromises = batch.map(platform => checkPlatform(platform, username));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to check ${batch[index].name}:`, result.reason);
          results.push({
            platform: batch[index].name,
            url: batch[index].url.replace('{username}', username),
            found: false,
            response_time: 0,
            confidence: 0.1
          });
        }
      });

      // Small delay between batches to be respectful
      if (i + batchSize < PLATFORMS.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const foundPlatforms = results.filter(r => r.found).length;
    const searchTime = Date.now() - startTime;

    const finalResult: UsernameSearchResult = {
      username,
      total_platforms: PLATFORMS.length,
      found_platforms: foundPlatforms,
      platforms: results.sort((a, b) => Number(b.found) - Number(a.found)), // Found results first
      search_time: searchTime,
      session_id: sessionId
    };

    // Save to database
    await saveResults(sessionId, username, finalResult);

    console.log(`Username OSINT completed: ${foundPlatforms}/${PLATFORMS.length} platforms found in ${searchTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        results: finalResult,
        message: `Found ${foundPlatforms} platforms for username: ${username}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in username-osint function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        results: null
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});