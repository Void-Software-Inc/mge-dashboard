import { createClient } from "@/utils/supabase/server"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function handleError(searchParams: { message: string }) {
  let isError = searchParams.message === 'Could not authenticate user';
  return isError;
}

export default async function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();
  if (!error || data?.user) {
    redirect("/");
  }

  return (
    <div className="flex justify-center items-center h-screen p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Login</CardTitle>
          <CardDescription className="text-base">
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <form action="/api/auth/login" method="POST">
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input className="text-base" name="email" id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-base">Password</Label>
              <Input className="text-base" name="password" id="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton className="w-full" pendingText="Logging in...">Login</SubmitButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
