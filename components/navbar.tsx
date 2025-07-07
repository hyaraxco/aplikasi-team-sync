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
import { Search, Menu, ChevronDown, Sun, Moon } from "lucide-react";
import { NotificationPanel } from "@/components/notification/NotificationPanel";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/hooks/use-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./atomics/Avatar.atomic";
import { useTheme } from "next-themes";

export function Navbar() {
  const { user, userRole, userData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

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

        <NotificationPanel />

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative rounded-full w-10 h-10 flex-shrink-0"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 h-auto rounded-full flex-shrink-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.photoURL || "./avatar.png"}
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
            <div className="flex flex-col gap-0.5 px-2 py-2 s">
              <div className="flex items-center gap-2">
                <span className="text-md font-semibold">{displayName}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                  {userRole}
                </span>
              </div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">
                {userData?.department}
              </div>
            </div>
            <DropdownMenuSeparator className="my-1" />
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
