import { Response, Request } from "express";
import { z } from "zod";

export const MessageSchema = z.object({
    message: z.string(),
});

export const ErrorSchema = z.object({
    error: z.string(),
});

export const BookSchema = z.object({
    id: z.string().min(1),
    author_id: z.string().min(1),
    title: z.string().min(1),
    pub_year: z.string().length(4).regex(/\d+/),
    genre: z.string().min(1),
});

export const BookArraySchema = z.object({
    books: z.array(BookSchema),
});

export const AuthorSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    bio: z.string().min(1),
});

export const AuthorArraySchema = z.object({
    authors: z.array(AuthorSchema),
});

export type Message = z.infer<typeof MessageSchema>;
export type Error = z.infer<typeof ErrorSchema>;
export type Book = z.infer<typeof BookSchema>;
export type BookArray = z.infer<typeof BookArraySchema>;
export type Author = z.infer<typeof AuthorSchema>;
export type AuthorArray = z.infer<typeof AuthorArraySchema>;

export type BookRequestBody = Request<{}, {}, Book>;
export type AuthorRequestBody = Request<{}, {}, Author>;

export type BookArrayResponse = Response<BookArray | Error>;
export type AuthorArrayResponse = Response<AuthorArray | Error>;
export type StringResponse = Response<Message | Error>;


// User Crediential routes item

export const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});


export type LoginBody = z.infer<typeof LoginSchema>
export type LoginRequestBody = Request<{}, {}, LoginBody>


