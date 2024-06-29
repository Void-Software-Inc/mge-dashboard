
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import Image from 'next/image';
import TextInput from '@/components/inputs/TextInput';

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
  const { data, error } = await supabase.auth.getUser()
    if (!error || data?.user) {
      redirect('/')
  }

  const signIn = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    return redirect("/");
  };
  
  return (
    <main className="flex justify-center md:items-center h-[100vh] bg-white">
      <div className="p-8 w-full h-[75vh] md:w-[400px] md:shadow-2xl rounded-lg flex flex-col justify-around">
        <div className="flex flex-col items-start items-center">
          <h2 className="text-black text-3xl md:text-2xl mb-12 saira font-semibold">Welcome</h2>
          <Image
            src="/static/svg/mgelogo.svg"
            alt="mgelogo"
            width={150}
            height={150}
            priority
            className="mb-8"
          />
        </div>
        <form>
          <div className='grid gap-4 w-full'>
            <div className='grid'>
              <TextInput
                type="text"
                name="email"
                placeholder="Email"
                error={handleError(searchParams)}
              />
            </div>
            <div className='grid'>
              <TextInput
                type="password"
                name="password"
                placeholder="Password"
                error={handleError(searchParams)}
              />
            </div>
            <div style={{ height: '24px' }}>
              {handleError(searchParams) && <p className="text-red-500 saira text-sm">Invalid email or password</p>}
            </div>
            <div className="flex justify-center w-full">
              <SubmitButton
                formAction={signIn}
                className="px-4 py-2 bg-orange-500 rounded cursor-pointer w-full saira"
                pendingText="Signing In..."
              >
                Sign In
              </SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}