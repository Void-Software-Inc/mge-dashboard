'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
export const Navbar = () => {
  const [navBarItemRight, setNavBarItemRight] = useState(5);

  const handleNavBarItemEnterRight = (newValue: React.SetStateAction<number>) => {
    setNavBarItemRight(newValue);
  };

  const handleNavBarItemLeaveRight = () => {
    setNavBarItemRight(5);
  };

  const [hamburgerController, setActive] = useState(false); //use state for hamburger state controller (x or =)
  const toggleClass = () => {
    setActive(!hamburgerController);
  };
  const toggleHambFalse = () => {
    setActive(false)
  }

  
  const rightNavBarItemsController = () => {
    return 'hidden font-bold text-black absolute top-6 lg:right-2 xl:right-24 h-[45px] lg:flex gap-8 lg:mr-10 xl:mr-0';
  };

  
  const blueBottomBorderControllerRight = () => {
    if (navBarItemRight == 5) {
      return 'hidden lg:flex absolute h-[65px] border-b-[3px] w-[36px] border-orange-500 transition-blueBorder lg:right-[48.3%] xl:right-[48.8%] duration-[400ms] ease-in-out';
    } else if (navBarItemRight == 1) {
      return 'absolute h-[65px] border-b-[3px] w-[36px] border-orange-500 transition-blueBorder lg:right-[265px] xl:right-[310px] duration-[700ms] ease-in-out';
    } else if (navBarItemRight == 2) {
      return 'absolute h-[65px] border-b-[3px] w-[36px] border-orange-500 duration-300 transition-blueBorder lg:right-[175px] xl:right-[225px] ease-in-out';
    } else if (navBarItemRight == 3) {
      return 'absolute h-[65px] border-b-[3px] w-[36px] border-orange-500 duration-300 transition-blueBorder lg:right-[80px] xl:right-[125px] ease-in-out';
    } 
  };
  

  return (
    <>
      {/*NavBar*/}
      <div className="Navbar">
        <header className='top-0 bg-gray-200 w-full flex justify-center fixed z-[800]'>
          <div className='h-[65px] flex items-center justify-center overflow-hidden z-[800] bg-gray-200 relative w-full'>
            <div className={blueBottomBorderControllerRight()}></div>
            <div className="z-[9999]">
              <a href='/' className="lg:animate-hideImage cursor-pointer z-[9999]">
                <Image
                  className="text-center"
                  src='/static/svg/mgelogosimple.svg'
                  alt="logolgAndUp"
                  width="70"
                  height="100"
                />
              </a>
              <div
                className={rightNavBarItemsController()}
                onMouseLeave={handleNavBarItemLeaveRight}>
                <Link href='/products' legacyBehavior scroll={false}>
                  <a
                    className="uppercase text-black font-semibold text-sm hover:transition hover:duration-[600ms] cursor-pointer hover:text-orange-500"
                    onMouseEnter={() => handleNavBarItemEnterRight(1)}
                  >
                    Produits
                  </a>
                </Link>
                <Link href='/quotes' legacyBehavior scroll={false}>
                  <a
                    className="uppercase text-black font-semibold text-sm hover:transition hover:duration-[600ms] cursor-pointer hover:text-orange-500"
                    onMouseEnter={() => handleNavBarItemEnterRight(2)}
                  >
                    Devis
                  </a>
                </Link>
                <Link href='/settings' legacyBehavior scroll={false}>
                  <a
                    className="uppercase text-black font-semibold text-sm hover:transition hover:duration-[600ms] cursor-pointer hover:text-orange-500"
                    onMouseEnter={() => handleNavBarItemEnterRight(3)}
                  >
                    Paramètres
                  </a>
                </Link>
              </div>
              <div onClick={toggleClass} className="absolute space-y-1.5 top-7 left-6 lg:hidden cursor-pointer">
                <span
                  className={
                    hamburgerController
                      ? 'block w-5 h-0.5 bg-black transition-transform duration-300 rotate-45 translate-y-1'
                      : 'block w-5 h-0.5 bg-black transition-transform duration-300'
                  }></span>
                <span
                  className={
                    hamburgerController
                      ? 'block w-5 h-0.5 bg-black transition-transform duration-300 -rotate-45 -translate-y-1'
                      : 'block w-5 h-0.5 bg-black transition-transform duration-300'
                  }></span>
              </div>
            </div>
          </div>
        </header>
      </div>
      {/*Mobile Menu*/}
      <div
        className={
          hamburgerController
            ? 'lg:hidden top-[65px] h-full bg-gray-300 w-full border-t-[0.01px] border-gray-300 border-opacity-40 fixed z-[799] transform transition-transform duration-500 translate-y-0'
            : 'lg:hidden top-[65px] h-full bg-gray-300 w-full fixed z-[799] transform transition-transform duration-500 -translate-y-full'
        }>
        <Link href='/products'>
          <div onClick={toggleHambFalse} className="text-lg font-bold uppercase text-black flex justify-center mt-12 hover:text-orange-500">
            <div>Produits</div>
          </div>
        </Link>  
        <Link href='/quotes'>
          <div onClick={toggleHambFalse} className="text-lg font-bold uppercase text-black flex justify-center mt-8 hover:text-orange-500">
            <div>Devis</div>
          </div>
        </Link> 
        <Link href='/settings'>
          <div onClick={toggleHambFalse} className="text-lg font-bold uppercase text-black flex justify-center mt-8 hover:text-orange-500">
            <div>Paramètres</div>
          </div>
        </Link> 
      </div>
    </>
  );
};