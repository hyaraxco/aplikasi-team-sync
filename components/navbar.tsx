"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/atomics/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/dropdown-menu";
import { Input } from "@/components/atomics/input";
import { Bell, Search, Menu, ChevronDown } from "lucide-react"; // Added ChevronDown
import { useRouter } from "next/navigation";
import { useSidebar } from "@/hooks/use-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./atomics/Avatar.atomic";

export function Navbar() {
  const { user, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      {/* Left Group: Hamburger (mobile) + Title */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden flex-shrink-0"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right Group: Notifications + User */}
      <div className="flex items-center gap-3">
        <form
          className="w-full max-w-md relative"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for anything..."
            className="w-full bg-muted pl-10 pr-4 py-2 rounded-full border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full w-10 h-10 flex-shrink-0"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary"></span>
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 h-auto rounded-full flex-shrink-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.photoURL || ""}
                  alt={user?.email || ""}
                />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground leading-none capitalize">
                  {userRole}
                </span>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
