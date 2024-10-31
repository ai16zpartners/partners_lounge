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
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
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
        // Initialize connections object if it doesn't exist
        if (!token.connections) {
          token.connections = {};
        }

        // Store connection data based on provider
        switch (account.provider) {
          case 'discord':
            token.connections.discord = {
              name: profile.username || profile.name,
              image: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            };
            break;
          case 'twitter':
            token.connections.twitter = {
              name: profile.data?.username || profile.name,
              image: profile.data?.profile_image_url || profile.image
            };
            break;
          case 'github':
            token.connections.github = {
              name: profile.login || profile.name,
              image: profile.avatar_url
            };
            break;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.connections = token.connections;
      }
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
  debug: process.env.NODE_ENV === 'development',
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
