import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC } from 'react';
import { SessionProvider } from 'next-auth/react';  // Import SessionProvider
import { ContextProvider } from '../contexts/ContextProvider';
import { AppBar } from '../components/AppBar';
import { ContentContainer } from '../components/ContentContainer';
import { Footer } from '../components/Footer';
import Notifications from '../components/Notification';
import '../styles/profile.css'; // Adjust the path based on your project structure.
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
];

const App: FC<AppProps> = ({ Component, pageProps }) => {
    return (
        <SessionProvider session={pageProps.session}> {/* Wrap everything in SessionProvider */}
          <Head>
            <title>ai16z Partners Lounge</title>
          </Head>

          <ContextProvider>
            <div className="flex flex-col h-screen">
              <Notifications />
              <AppBar />
              <ContentContainer>
                <Component {...pageProps} />
                <Footer />
              </ContentContainer>
            </div>
          </ContextProvider>
        </SessionProvider>
    );
};

export default App;
