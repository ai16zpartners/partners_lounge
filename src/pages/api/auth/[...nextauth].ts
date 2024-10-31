// Rename file to [...nextauth].ts
import NextAuth, { Session, NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import GitHubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";
import { JWT } from 'next-auth/jwt';

type CustomSession = Session & {
  connections?: {
    [key: string]: {
      accessToken: string;
      profile: any;
    };
  };
};

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          image: profile.data.profile_image_url,
          username: profile.data.username,
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email'
        }
      }
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { 
        params: { 
          scope: 'identify email' 
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signout'
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign in callback:', { user, account, profile });
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.providers = token.providers || {};
        token.providers[account.provider] = {
          accessToken: account.access_token,
          profile: profile
        };
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user.connections = token.providers || {};
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
  session: {
    strategy: "jwt",
    // Keep sessions alive longer to maintain multiple connections
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('Auth error:', { code, metadata });
    },
    warn(code) {
      console.warn('Auth warning:', { code });
    },
    debug(code, metadata) {
      console.log('Auth debug:', { code, metadata });
    }
  }
};

export default NextAuth(authOptions);
