import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Gift, UserCircle, Menu, X } from "lucide-react";
import { useState } from "react";
// [ADD] Import ThemeToggle
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getNavLinks = () => {
    // Removed "Home" and "Promotions" links.
    const links = [];

    if (user) {
      if (userRole === "admin") {
        links.push({ name: "Admin Dashboard", path: "/admin" });
      } else if (userRole === "company") {
        links.push({ name: "Company Dashboard", path: "/company" });
      } else {
        links.push({ name: "My Dashboard", path: "/dashboard" });
      }
    }

    // The "Promotions" link has been removed from here.

    return links;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = getNavLinks();

  // Hide header on Auth page
  if (location.pathname === "/auth") {
    return null;
  }

  // Desktop navigation
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and primary navigation links */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 text-xl font-bold text-primary"
          >
            <Gift className="w-6 h-6" />
            <span>GiveawayHub</span>
          </button>
          <nav className="hidden space-x-4 md:flex">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant="link"
                onClick={() => navigate(link.path)}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname.startsWith(link.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Button>
            ))}
          </nav>
        </div>

        {/* Action buttons (Sign In/Out, Profile, Menu) */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              {/* User profile button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                className="hidden md:inline-flex"
              >
                <UserCircle className="w-5 h-5" />
                <span className="sr-only">Profile</span>
              </Button>
              {/* [MOD] ThemeToggle is placed next to the Sign Out Button */}
              <ThemeToggle />
              {/* Sign Out Button */}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              {/* [MOD] ThemeToggle is placed next to the Sign In Button, wrapped in a fragment for spacing */}
              <ThemeToggle />
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </>
          )}
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div className="absolute left-0 top-16 w-full border-b bg-background p-4 shadow-lg md:hidden">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  variant="ghost"
                  onClick={() => {
                    navigate(link.path);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full justify-start ${
                    location.pathname.startsWith(link.path) ? "font-bold" : ""
                  }`}
                >
                  {link.name}
                </Button>
              ))}
            </nav>
            <div className="flex flex-col space-y-2 pt-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <UserCircle className="w-5 h-5 mr-2" />
                    Profile
                  </Button>
                  {/* [ADD] ThemeToggle in mobile menu (logged in) */}
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-medium">Dark Mode</span>
                    <ThemeToggle />
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  {/* [ADD] ThemeToggle in mobile menu (logged out) */}
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-medium">Dark Mode</span>
                    <ThemeToggle />
                  </div>
                  <Button
                    onClick={() => {
                      navigate("/auth");
                      setIsMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { LogOut, Gift, UserCircle, Menu, X } from "lucide-react";
// import { useState } from "react";

// const Header = () => {
//   const { user, userRole, signOut } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   const getNavLinks = () => {
//     const links = [{ name: "Home", path: "/" }];

//     if (user) {
//       if (userRole === "admin") {
//         links.push({ name: "Admin Dashboard", path: "/admin-dashboard" });
//       } else if (userRole === "company") {
//         links.push({ name: "Company Dashboard", path: "/dashboard" });
//       } else {
//         links.push({ name: "My Dashboard", path: "/dashboard" });
//       }
//     }

//     return links;
//   };

//   const handleSignOut = async () => {
//     await signOut();
//     navigate("/");
//   };

//   const navLinks = getNavLinks();

//   // Hide header on Auth page
//   if (location.pathname === "/auth") {
//     return null;
//   }

//   return (
//     <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
//       <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
//         {/* Logo and Branding */}
//         <div className="flex items-center space-x-4">
//           <Button
//             variant="ghost"
//             className="text-xl font-bold text-primary flex items-center gap-2"
//             onClick={() => navigate("/")}
//           >
//             <Gift className="w-6 h-6" />
//             GiveawayHub
//           </Button>

//           {/* Desktop Navigation */}
//           <nav className="hidden md:flex space-x-4">
//             {navLinks.map((link) => (
//               <Button
//                 key={link.name}
//                 variant="link"
//                 onClick={() => navigate(link.path)}
//                 className={
//                   location.pathname === link.path
//                     ? "text-primary font-semibold"
//                     : "text-muted-foreground"
//                 }
//               >
//                 {link.name}
//               </Button>
//             ))}
//           </nav>
//         </div>

//         {/* Auth Actions */}
//         <div className="hidden md:flex items-center space-x-2">
//           {user ? (
//             <>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => navigate("/profile")}
//                 aria-label="Profile"
//               >
//                 <UserCircle className="w-5 h-5" />
//               </Button>
//               <Button
//                 onClick={handleSignOut}
//                 variant="outline"
//                 className="flex items-center gap-1"
//               >
//                 <LogOut className="w-4 h-4" />
//                 Sign Out
//               </Button>
//             </>
//           ) : (
//             <Button onClick={() => navigate("/auth")}>Sign In</Button>
//           )}
//         </div>

//         {/* Mobile Menu Button */}
//         <Button
//           variant="ghost"
//           size="icon"
//           className="md:hidden"
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//           aria-label="Toggle menu"
//         >
//           {isMenuOpen ? (
//             <X className="w-6 h-6" />
//           ) : (
//             <Menu className="w-6 h-6" />
//           )}
//         </Button>
//       </div>

//       {/* Mobile Menu Overlay */}
//       {isMenuOpen && (
//         <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b shadow-lg p-4 transition-all duration-300 ease-in-out">
//           <nav className="flex flex-col space-y-2 pb-4 border-b">
//             {navLinks.map((link) => (
//               <Button
//                 key={link.name}
//                 variant="ghost"
//                 onClick={() => {
//                   navigate(link.path);
//                   setIsMenuOpen(false);
//                 }}
//                 className={`w-full justify-start ${
//                   location.pathname === link.path
//                     ? "text-primary font-semibold bg-secondary/50"
//                     : ""
//                 }`}
//               >
//                 {link.name}
//               </Button>
//             ))}
//           </nav>
//           <div className="flex flex-col space-y-2 pt-4">
//             {user ? (
//               <>
//                 <Button
//                   variant="ghost"
//                   onClick={() => {
//                     navigate("/profile");
//                     setIsMenuOpen(false);
//                   }}
//                   className="w-full justify-start"
//                 >
//                   <UserCircle className="w-5 h-5 mr-2" />
//                   Profile
//                 </Button>
//                 <Button
//                   onClick={handleSignOut}
//                   variant="outline"
//                   className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
//                 >
//                   <LogOut className="w-4 h-4 mr-2" />
//                   Sign Out
//                 </Button>
//               </>
//             ) : (
//               <Button
//                 onClick={() => {
//                   navigate("/auth");
//                   setIsMenuOpen(false);
//                 }}
//                 className="w-full"
//               >
//                 Sign In
//               </Button>
//             )}
//           </div>
//         </div>
//       )}
//     </header>
//   );
// };

// export default Header;
