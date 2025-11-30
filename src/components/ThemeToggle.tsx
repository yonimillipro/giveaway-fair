import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    // If current theme is dark, switch to light, otherwise switch to dark
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Determine the icon and accessibility label based on the current theme
  const Icon = theme === "dark" ? Sun : Moon;
  const tooltipText =
    theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={tooltipText}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
// // src/components/ThemeToggle.tsx

// import * as React from "react";
// import { Moon, Sun } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useTheme } from "@/contexts/ThemeContext"; // Assuming a ThemeContext exists

// // If you don't have a ThemeContext, you can use the following simplified logic:
// const useTheme = () => {
//   const [theme, setTheme] = React.useState<"light" | "dark">(() => {
//     // Check initial preference from localStorage or default to 'light'
//     if (typeof window !== "undefined") {
//       const storedTheme = localStorage.getItem("theme");
//       if (
//         storedTheme === "dark" ||
//         (!storedTheme &&
//           window.matchMedia("(prefers-color-scheme: dark)").matches)
//       ) {
//         document.documentElement.classList.add("dark");
//         return "dark";
//       }
//     }
//     document.documentElement.classList.remove("dark");
//     return "light";
//   });

//   React.useEffect(() => {
//     if (theme === "dark") {
//       document.documentElement.classList.add("dark");
//       localStorage.setItem("theme", "dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//       localStorage.setItem("theme", "light");
//     }
//   }, [theme]);

//   const toggleTheme = () => {
//     setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
//   };

//   return { theme, toggleTheme };
// };

// export function ThemeToggle() {
//   const { theme, toggleTheme } = useTheme();

//   return (
//     <Button
//       variant="ghost"
//       size="icon"
//       onClick={toggleTheme}
//       className="h-9 w-9"
//     >
//       {theme === "light" ? (
//         <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
//       ) : (
//         <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
//       )}
//       <span className="sr-only">Toggle theme</span>
//     </Button>
//   );
// }
