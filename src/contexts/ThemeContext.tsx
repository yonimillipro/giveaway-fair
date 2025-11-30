import * as React from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextProps {
  setTheme: (theme: Theme) => void;
  theme: Theme;
}

const initialState: ThemeContextProps = {
  setTheme: () => null,
  theme: "system",
};

const ThemeContext = React.createContext<ThemeContextProps>(initialState);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    // Attempt to load theme from local storage or default to system
    return (localStorage.getItem("vite-ui-theme") as Theme) || "system";
  });

  React.useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Apply system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      // Store system as the chosen theme
      localStorage.setItem("vite-ui-theme", "system");
      return;
    }

    // Apply explicit theme
    root.classList.add(theme);
    localStorage.setItem("vite-ui-theme", theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setThemeState(newTheme);
    },
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
// // src/contexts/ThemeContext.tsx

// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";
// import { Moon, Sun } from "lucide-react";
// import { Button } from "@/components/ui/button"; // Assuming Button component path

// type Theme = "dark" | "light";

// interface ThemeContextType {
//   theme: Theme;
//   setTheme: (theme: Theme) => void;
//   toggleTheme: () => void;
//   ThemeToggle: React.FC;
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// // 1. Theme Provider Component
// export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
//   children,
// }) => {
//   const [theme, setThemeState] = useState<Theme>(() => {
//     // Initialize theme from local storage or system preference
//     const storedTheme = localStorage.getItem("theme") as Theme;
//     if (storedTheme) return storedTheme;

//     // Default to 'dark' if system preference is dark, otherwise 'light'
//     return window.matchMedia("(prefers-color-scheme: dark)").matches
//       ? "dark"
//       : "light";
//   });

//   // 2. Effect to apply the theme class to the document root and save to local storage
//   useEffect(() => {
//     const root = window.document.documentElement;

//     // Remove both classes to ensure only the current theme is applied
//     root.classList.remove("light", "dark");

//     // Add the current theme class
//     root.classList.add(theme);
//     localStorage.setItem("theme", theme);
//   }, [theme]);

//   const setTheme = (newTheme: Theme) => {
//     setThemeState(newTheme);
//   };

//   const toggleTheme = () => {
//     setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
//   };

//   // 3. Theme Toggle Button component (for easy use in Header)
//   const ThemeToggle: React.FC = () => (
//     <Button
//       variant="ghost"
//       size="icon"
//       onClick={toggleTheme}
//       className="p-2 transition-colors"
//       aria-label="Toggle theme"
//     >
//       {theme === "light" ? (
//         <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
//       ) : (
//         <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
//       )}
//       <span className="sr-only">Toggle theme</span>
//     </Button>
//   );

//   return (
//     <ThemeContext.Provider
//       value={{ theme, setTheme, toggleTheme, ThemeToggle }}
//     >
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// // 4. Custom Hook
// export const useTheme = () => {
//   const context = useContext(ThemeContext);
//   if (context === undefined) {
//     throw new Error("useTheme must be used within a ThemeProvider");
//   }
//   return context;
// };
