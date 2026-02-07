"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Library } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

export function NavShell() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(api.users.getCurrent);
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName =
    convexUser?.name || clerkUser?.fullName || "Researcher";
  const email = convexUser?.email || clerkUser?.primaryEmailAddress?.emailAddress;
  const avatarUrl =
    convexUser?.avatarUrl || clerkUser?.imageUrl;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-xl font-bold">
          V1 Drafts
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex">
          <Link
            href="/search"
            className="flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            Search Papers
          </Link>
          <Link
            href="/library"
            className="flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Library className="h-4 w-4" />
            My Library
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex min-h-[44px] items-center gap-2 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="min-h-[44px] cursor-pointer"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Open menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex flex-col gap-4 pt-6">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-1">
                  <Link
                    href="/search"
                    className="flex min-h-[44px] items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Search className="h-4 w-4" />
                    Search Papers
                  </Link>
                  <Link
                    href="/library"
                    className="flex min-h-[44px] items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Library className="h-4 w-4" />
                    My Library
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full min-h-[44px] justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
