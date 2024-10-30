// pages/venture-capital.js
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function VentureCapital() {
    const [walletConnected, setWalletConnected] = useState(false);

    const connectWallet = () => {
        // Realistic wallet connection logic
        console.log('Connecting wallet...');
        setWalletConnected(true);
    };

    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <header className="mb-4">
                <h1 className="text-4xl font-bold" style={{ color: '#F98D13' }}>ai16z</h1>
            </header>

            <main>
                <section className="mb-10">
                    <h2 className="text-3xl text-black font-bold mb-3">Venture Capital for the Singularity</h2>
                    <p className="text-black  mb-4">Committed capital across multiple dimensions</p>
                    <button
                        className="bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600 transition duration-150"
                        onClick={connectWallet}
                    >
                        {walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
                    </button>
                </section>

                <section className="mb-10">
                    <div className="flex justify-center gap-2 mt-4">
                        <Link href="https://github.com/ai16z">
                            <button className="border px-4 py-2 text-black rounded hover:bg-gray-200 transition duration-150">Github</button>
                        </Link>
                        <Link href="https://x.com/pmairca">
                            <button className="border px-4 py-2 rounded text-black hover:bg-gray-200 transition duration-150">Twitter</button>
                        </Link>
                        <button className="border px-4 py-2 text-black rounded">Fund</button>
                        <Link href="https://discord.gg/ai16z">
                            <button className="border px-4 py-2 text-black rounded hover:bg-gray-200 transition duration-150">Discord</button>
                        </Link>
                    </div>
                </section>

                <section className="mb-10 text-black">
                    <h3 className="text-2xl font-bold mb-2 text-black">Our Agent Partners</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                        <div className="border p-4">
                            <Image src="/marc-andreescan.jpg" alt="Marc Andreescan" width={100} height={100} className="rounded-full" />
                            <h4 className="mt-2 text-black">Marc Andreescan</h4>
                            <p>The greatest VC in AI</p>
                        </div>
                        <div className="border p-4">
                            <Image src="/degen-spartan.jpg" alt="Degen Spartan AI" width={100} height={100} className="rounded-full" />
                            <h4 className="mt-2  text-black">Degen Spartan AI</h4>
                            <p>Former Degenspartan</p>
                        </div>
                    </div>
                </section>

                <section className="mb-10 text-black">
                    <h3 className="text-2xl text-black font-bold mb-2">Frequently asked questions</h3>
                    <article>
                        <h4 className="font-bold text-black">What is ai16z?</h4>
                        <p>An AI venture capital firm dedicated to backing bold AI agents and autonomous technology.</p>
                    </article>
                    {/* More FAQs can be added here */}
                </section>
            </main>
        </div>
    );
}
