
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { registerSchema } from '@/lib/validations/auth';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
       return NextResponse.json(
        { message: 'Validation failed', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validationResult.data;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await db.insert(users).values({
      name,
      email,
      password_hash: hashedPassword,
      role: role || 'user',
    }).returning();

    // Check if newUser array is valid
    if (!newUser || newUser.length === 0) {
        return NextResponse.json(
            { message: 'Failed to create user' },
            { status: 500 }
        );
    }

    return NextResponse.json(
      { message: 'User created successfully', user: { id: newUser[0].id, email: newUser[0].email } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
