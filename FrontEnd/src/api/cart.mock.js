export async function addToCart() {
  return { success: true };
}

export async function batchAddToCart(items) {
  return { success: true, count: Array.isArray(items) ? items.length : 0 };
}

