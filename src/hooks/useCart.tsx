import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount
      const products = [...cart];
      const findProduct = products.find(product=>product.id === productId)
      const currentAmount = findProduct ? findProduct.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(findProduct){
        findProduct.amount = amount
      }else{
        const product = await api.get(`/products/${productId}`)
        if(!product){
          toast.error("Erro na adição do produto")
        }
        const newProduct = {
          ...product.data,
          amount: 1
        }

        products.push(newProduct);
      }
      setCart(products);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))

    } catch {
      // TODO
      toast.error("Erro na adição do produto")
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart]
      const removeProduct = updatedCart.findIndex(product=>product.id===productId)
      
      if(removeProduct >= 0){
        updatedCart.splice(removeProduct, 1)
       
      setCart(updatedCart)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
      }else{
        toast.error("Erro na remoção do produto")
      }

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount<=0){
        return 
      }
      const {data} = await api.get<Stock>(`/stock/${productId}`)

      if(amount > data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return 
      }

      const updatedCart = [...cart]
      const findProduct = updatedCart.find(product=> product.id===productId)
      if(findProduct){
        findProduct.amount = amount
        setCart(updatedCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
      }else{
        throw new Error()
      }

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
