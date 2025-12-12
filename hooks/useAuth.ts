  "use client";



 import React from "react"; 

 import { StaticImport } from "next/dist/shared/lib/get-img-props"; 



 export interface User { 

   id?: string; 

   name: string; 

   email: string; 

   avatarUrl?: string | StaticImport; 

   role: "ADMIN" | "LEARNER"; 

 } 



 export function useAuth() { 

   const [user, setUser] = React.useState<User | null>(null); 

   const [loading, setLoading] = React.useState(true); 



   React.useEffect(() => { 

     const fetchUser = async () => { 

       try { 

         const res = await fetch("/api/me", { credentials: "include" }); 

         if (!res.ok) throw new Error("Unauthenticated"); 

         const data = await res.json(); 

         setUser(data); 

       } catch { 

         setUser(null); 

       } finally { 

         setLoading(false); 

       } 

     }; 

     fetchUser(); 

   }, []); 



   const logout = async () => { 

     await fetch("/api/logout", { method: "POST" }); 

     setUser(null); 

     window.location.href = "/"; 

   }; 



   return { user, loading, logout }; 

 }
