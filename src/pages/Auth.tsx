import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "sonner";
import { Gift, ArrowLeft } from "lucide-react"; // Import ArrowLeft

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Welcome back!");
        }
      } else {
        if (!fullName.trim()) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created successfully!");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-card relative">
        {" "}
        {/* Added relative for positioning */}
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4" // Positioned top-left
          onClick={() => navigate("/")} // Navigates to the home page
          aria-label="Go back to home page"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-primary rounded-2xl">
              <Gift className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to GiveawayHub</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={isLogin ? "login" : "signup"}
            onValueChange={(v) => setIsLogin(v === "login")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// import { toast } from "sonner";
// import { Gift } from "lucide-react";

// const Auth = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { signIn, signUp } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       if (isLogin) {
//         const { error } = await signIn(email, password);
//         if (error) {
//           toast.error(error.message);
//         } else {
//           toast.success("Welcome back!");
//         }
//       } else {
//         if (!fullName.trim()) {
//           toast.error("Please enter your full name");
//           setLoading(false);
//           return;
//         }
//         const { error } = await signUp(email, password, fullName);
//         if (error) {
//           toast.error(error.message);
//         } else {
//           toast.success("Account created successfully!");
//           navigate("/dashboard");
//         }
//       }
//     } catch (error) {
//       toast.error("An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
//       <Card className="w-full max-w-md shadow-card">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <div className="p-3 bg-gradient-primary rounded-2xl">
//               <Gift className="w-8 h-8 text-primary-foreground" />
//             </div>
//           </div>
//           <CardTitle className="text-2xl">Welcome to GiveawayHub</CardTitle>
//           <CardDescription>
//             {isLogin ? "Sign in to your account" : "Create your account"}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Tabs
//             value={isLogin ? "login" : "signup"}
//             onValueChange={(v) => setIsLogin(v === "login")}
//           >
//             <TabsList className="grid w-full grid-cols-2 mb-6">
//               <TabsTrigger value="login">Login</TabsTrigger>
//               <TabsTrigger value="signup">Sign Up</TabsTrigger>
//             </TabsList>

//             <form onSubmit={handleSubmit} className="space-y-4">
//               {!isLogin && (
//                 <div className="space-y-2">
//                   <Label htmlFor="fullName">Full Name</Label>
//                   <Input
//                     id="fullName"
//                     type="text"
//                     placeholder="John Doe"
//                     value={fullName}
//                     onChange={(e) => setFullName(e.target.value)}
//                     required={!isLogin}
//                   />
//                 </div>
//               )}

//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="you@example.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <Input
//                   id="password"
//                   type="password"
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   minLength={6}
//                 />
//               </div>

//               <Button type="submit" className="w-full" disabled={loading}>
//                 {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
//               </Button>
//             </form>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Auth;
