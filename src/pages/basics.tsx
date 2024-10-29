import type { NextPage } from "next";
import Head from "next/head";
import { BasicsView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Partners Lounge</title>
        <meta
          name="description"
          content="LeaderBoard"
        />
      </Head>
      <BasicsView />
    </div>
  );
};

export default Basics;
