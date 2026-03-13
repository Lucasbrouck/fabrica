import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { 
      email, password, name, cnpj, phone, role,
      postalCode, address, addressNumber, complement, province, city, state 
    } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        cnpj,
        phone,
        postalCode,
        address,
        addressNumber,
        complement,
        province,
        city,
        state,
        role: role || 'CUSTOMER',
      },
    });

    // Integrated Asaas Customer Creation
    console.log(`Starting Asaas registration for user: ${user.email}`);
    try {
      const { createAsaasCustomer } = await import('@/lib/asaas');
      
      const payload = {
        name: user.name,
        email: user.email,
        cnpj: (user as any).cnpj || '',
        phone: (user as any).phone || undefined,
        postalCode: (user as any).postalCode || undefined,
        addressNumber: (user as any).addressNumber || undefined,
        address: (user as any).address || undefined,
        province: (user as any).province || undefined,
        city: (user as any).city || undefined,
        state: (user as any).state || undefined,
      };

      console.log("Sending payload to Asaas:", JSON.stringify(payload, null, 2));

      const asaasCustomer = await createAsaasCustomer(payload);

      if (asaasCustomer && asaasCustomer.id) {
        console.log(`Asaas customer created successfully. ID: ${asaasCustomer.id}`);
        await prisma.user.update({
          where: { id: user.id },
          data: { asaasCustomerId: asaasCustomer.id }
        });
        console.log(`User ${user.id} updated with Asaas ID.`);
      } else {
        console.error("Asaas customer created but no ID returned from API.");
      }
    } catch (asaasError: any) {
      console.error("Failed to create Asaas customer during registration:");
      console.error("Error Message:", asaasError.message);
      if (asaasError.cause) console.error("Error Cause:", asaasError.cause);
    }

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
