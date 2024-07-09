"use client"

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { CircleUser, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar(){
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = () => {
    setIsOpen(false);
  }
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            legacyBehavior
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Image className="cursor-pointer" src="/static/svg/mglogo.svg" alt="logo" width={32} height={32} />
          </Link>
          <Link
            href="/products"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Products
          </Link>
          <Link
            href="/quotes"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Quotes
          </Link>
          <Link
            href="/settings"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Settings
          </Link>
        </nav>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                legacyBehavior
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Image onClick={handleItemClick} className="cursor-pointer" src="/static/svg/mglogo.svg" alt="logo" width={32} height={32} />
              </Link>
              <Link
                href="/products"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleItemClick}
              >
                Products
              </Link>
              <Link
                href="/quotes"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleItemClick}
              >
                Quotes
              </Link>
              <Link
                href="/settings"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleItemClick}
              >
                Settings
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full justify-end items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:cursor-pointer text-muted-foreground hover:text-foreground">Settings</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="hover:cursor-pointer text-muted-foreground hover:text-foreground">
                    Logout
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
  )
}