# MGE Dashboard

A modern dashboard application built with Next.js and Supabase, featuring authentication and data visualization capabilities.

## Features

- 🔐 Secure authentication with Supabase
- 📊 Data visualization and statistics
- 🎨 Modern UI built with Radix UI components
- ⚡️ Server-side rendering with Next.js
- 🔄 Real-time data updates with React Query

## Tech Stack

- **Framework**: Next.js
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **UI Components**: Radix UI
- **State Management**: React Query
- **Styling**: Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up your environment variables:
Create a `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and configurations
- `/src/services` - API and service integrations
- `/src/utils` - Helper functions and utilities
- `/src/hooks` - Custom React hooks

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
