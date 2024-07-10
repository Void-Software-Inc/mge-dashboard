import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const supabase = createClient();
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?message=Could not authenticate user");
  }

  return redirect("/");
}