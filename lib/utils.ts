import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

export function getRequestBaseUrl(request: Request): string {
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
  const proto = headers.get("x-forwarded-proto") || "http";
  
  const cleanProto = proto.split(",")[0].trim();
  const cleanHost = host.split(",")[0].trim();
  
  return `${cleanProto}://${cleanHost}`;
}
