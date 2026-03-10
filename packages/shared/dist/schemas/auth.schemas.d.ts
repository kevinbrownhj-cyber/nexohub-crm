import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const authResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        roles: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        name: string;
        roles: string[];
    }, {
        email: string;
        id: string;
        name: string;
        roles: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    accessToken: string;
    user: {
        email: string;
        id: string;
        name: string;
        roles: string[];
    };
}, {
    refreshToken: string;
    accessToken: string;
    user: {
        email: string;
        id: string;
        name: string;
        roles: string[];
    };
}>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
