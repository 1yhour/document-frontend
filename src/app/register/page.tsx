"use client"
import { Card , CardAction, CardContent, CardFooter , CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { FormEvent } from "react";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const { isSubmitting, error, validationErrors, register,user } = useAuth();
  
  useEffect(() => {
    if (!isSubmitting && user) {
      router.push("/");
    }
  }, [user, isSubmitting, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    register({ name, email, password, password_confirmation });
  };
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader>
          <CardTitle>Register to your account</CardTitle>
          <CardDescription>
            Enter your email below to register to your account
          </CardDescription>
          <CardAction>
            <Button variant="link" type="button" onClick={() => router.push("/login")}>
              Sign In
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-4">
              {/* General error message */}
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required/>
                {validationErrors?.name && (
                  <p className="text-xs text-destructive">
                    {validationErrors.name[0]}
                  </p>
                )}
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {validationErrors?.email && (
                <p className="text-xs text-destructive">
                  {validationErrors.email[0]}
                </p>
              )}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {validationErrors?.password && (
                <p className="text-xs text-destructive">
                  {validationErrors.password[0]}
                </p>
              )}
              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={password_confirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {validationErrors?.password_confirmation && (
                <p className="text-xs text-destructive">
                  {validationErrors.password_confirmation[0]}
                </p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2 pt-2">
          <Button type="submit" className="w-full" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? (
            <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering...
            </>
            ) : (
              "Register"
            )}
          </Button>
          <Button variant="outline" type="button" className="w-full">Register with Google</Button>
        </CardFooter>
      </Card>
    </div>
  );
}