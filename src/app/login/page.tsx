'use client';

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from 'next/image';

import TextInput from '@/components/inputs/textInput';

export default function Login() {
  const [data, setData] = useState<{
    email: string,
    password: string
  }>({
    email: '',
    password: ''
  })

  const router = useRouter();
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const login = async () => {
    try {
      let { data: dataUser, error } = await supabase
        .auth
        .signInWithPassword({
          email: data.email,
          password: data.password
        })

      if (dataUser && !error) {
        router.refresh();
      }
      if (error) {
        setError(true)
        setErrorMessage('Invalid credentials')
        setTimeout(() => {
          setError(false)
          setErrorMessage('')
        }, 3000)
      }
    } catch (error) {
      console.log(error)
      setError(true)
    }
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  }

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
        <div></div>
        <div className='grid gap-4 w-full'>
          <div className='grid'>
            <TextInput
              type="text"
              name="email"
              placeholder="Email"
              value={data.email}
              onChange={handleChange}
              error={error}
            />
          </div>
          <div className='grid'>
            <TextInput
              type="password"
              name="password"
              placeholder="Password"
              value={data.password}
              onChange={handleChange}
              error={error}
            />
          </div>
          <div style={{ height: '24px' }}>
            {error && <p className="text-red-500 saira text-sm">{errorMessage}</p>}
          </div>
          <div className="flex justify-center w-full">
            <button onClick={login} className="px-4 py-2 bg-orange-500 rounded cursor-pointer w-full saira">Login</button>
          </div>
        </div>
      </div>
    </main>
  )
}