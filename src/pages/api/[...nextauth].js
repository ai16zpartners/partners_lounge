// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

export default NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      version: "1.0A"
    }),
  ],
  // Add any additional NextAuth configuration here
})
