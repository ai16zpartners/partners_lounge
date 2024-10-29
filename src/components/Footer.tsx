import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const Footer: FC = () => {
    return (
        <div className="flex">
            <footer className="border-t-2 border-[#E8E3D5] bg-[#E8E3D5] text-neutral-content w-screen" >
                <div className="ml-12 py-12 mr-12">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-8 md:space-x-12 relative">
                        <div className='flex flex-col col-span-2 mx-4 items-center md:items-start'>
                            <div className='flex flex-row ml-1'>
                                {/* <Link href="https://ai16z.vc" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                                    <div className='flex flex-row ml-1'>
                                        <Image
                                            src="/logo.png"
                                            alt="icon"
                                            width={50}
                                            height={50}
                                        />
                                    </div>
                                </Link> */}
                            </div>
                            <div className="flex md:ml-2">
                                <a href="https://twitter.com/pmairca" type="button" className="border-black text-secondary hover:text-white leading-normal hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out w-9 h-9 m-1">
                                    {/* Twitter SVG icon here */}
                                </a>
                                <a href="https://github.com/ai16z" type="button" className="border-white text-secondary hover:text-white leading-normal hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out w-9 h-9 m-1">
                                    {/* GitHub SVG icon here */}
                                </a>
                            </div>
                            {/* <div className="mb-6 m-1 sm:text-left justify-center place-items-start items-start font-normal tracking-tight text-secondary">
                                © 2024 ai16z. All rights reserved.
                            </div> */}
                        </div>

                        <div className="mb-6 items-center mx-auto max-w-screen-lg">
                            {/* Other sections here */}
                        </div>

                        <div className="mb-6 items-center mx-auto max-w-screen-lg">
                            {/* Other sections here */}
                        </div>

                        <div className="mb-6 items-center mx-auto max-w-screen-lg">
                            {/* Other sections here */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
