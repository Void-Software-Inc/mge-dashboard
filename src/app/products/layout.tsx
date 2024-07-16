import { ProductsProvider } from './context/ProductsContext'

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <ProductsProvider>{children}</ProductsProvider>
}