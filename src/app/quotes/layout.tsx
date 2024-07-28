import { QuotesProvider } from './context/QuotesContext'

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return <QuotesProvider>{children}</QuotesProvider>
}