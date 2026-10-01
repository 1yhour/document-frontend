"use client"
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export default function Home() {
  const {user,logout} = useAuth();
  const router = useRouter();
  return (
    <div>
      <h1>Hello World</h1>
      <p>this is just for testing</p>
      <p>{user?.name}</p>
      <p>{user?.email}</p>
      <Button variant={"destructive"} onClick={logout}>logout</Button>
    </div>
  );
}