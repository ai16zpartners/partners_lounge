import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>ai16z Partners Lounge</title>
        <meta
          name="description"
          content="Partners Lounge"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
