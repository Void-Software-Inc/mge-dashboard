import { Product, ProductRecord, ProductImage } from "@/utils/types/products";

const API_URL = '/api';

/********************* PRODUCTS *********************/
  
export async function getProducts(): Promise<Product[]> {
  try {
    const url = `${API_URL}/products`
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const { products } = await response.json();
    const cleanProducts = products.map((product: Product) => ({
      id: product.id,
      name: product.name,
      type: product.type,
      color: product.color,
      stock: product.stock,
      ttc_price: product.ttc_price,
      ht_price: product.ht_price,
      description: product.description,
      image_url: product.image_url,
      category: product.category,
      created_at: product.created_at,
      last_update: product.last_update,
    }))
    return cleanProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getProduct(id: number): Promise<Product> {
  try {
    const url = `${API_URL}/products/${id}`

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch product with id ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
}

export async function createProduct(formData: FormData): Promise<Product> {
  try {
    const url = `${API_URL}/products/create`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to create product');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(formData: FormData): Promise<Product> {
  try {
    const url = `${API_URL}/products/update`;

    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update product');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(ids: number[]): Promise<void> {
  try {
    const url = `${API_URL}/products/delete`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete product(s)');
    }
  } catch (error) {
    console.error('Error deleting product(s):', error);
    throw error;
  }
}

/********************* PRODUCT IMAGES *********************/

export async function getProductImages(id: number): Promise<ProductImage[]> {
  try {
    const url = `${API_URL}/products/${id}/images`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch images for product with id ${id}`);
    }
    const data = await response.json();
    return data.productImages;
  } catch (error) {
    console.error(`Error fetching images for product with id ${id}:`, error);
    throw error;
  }
}

export async function createProductImage(productId: number, imageFile: File): Promise<ProductImage> {
  try {
    const url = `${API_URL}/products/${productId}/images/create`;
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to create product image');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating product image:', error);
    throw error;
  }
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  try {
    const url = `${API_URL}/products/${productId}/images/delete`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete product image');
    }
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
}



/********************* PRODUCT RECORDS *********************/

export async function getProductsRecords(): Promise<ProductRecord[]> {
  try {
    const url = `${API_URL}/records/products`
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch products records');
    }
    const { products_records } = await response.json();
    const cleanProductsRecords = products_records.map((product: ProductRecord) => ({
      id: product.id,
      name: product.name,
      type: product.type,
      color: product.color,
      stock: product.stock,
      ttc_price: product.ttc_price,
      ht_price: product.ht_price,
      description: product.description,
      image_url: product.image_url,
      category: product.category,
      deleted_at: product.deleted_at,
    }))
    return cleanProductsRecords;
  } catch (error) {
    console.error('Error fetching products records:', error);
    throw error;
  }
}

export async function restoreProductRecord(ids: number[]): Promise<void> {
  try {
    const url = `${API_URL}/records/products/restore`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to restore product(s)');
    }
  } catch (error) {
    console.error('Error restoring product(s):', error);
    throw error;
  }
}

export async function deleteProductRecord(ids: number[]): Promise<void> {
  try {
    const url = `${API_URL}/records/products/delete`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete product(s) from records');
    }
  } catch (error) {
    console.error('Error deleting product(s) from records:', error);
    throw error;
  }
}

/********************* PRODUCT STATS *********************/

export async function getMostPopularProducts(): Promise<{ id: string; name: string; count: number; average_quantity: number }[]> {
  try {
    const url = `${API_URL}/stats/mostPopularProducts`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch most popular products');
    }
    const { popularProducts } = await response.json();
    return popularProducts;
  } catch (error) {
    console.error('Error fetching most popular products:', error);
    throw error;
  }
}