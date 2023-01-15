import { Response, Request } from "express";
import { z } from "zod";

export const MessageSchema = z.object({
    message: z.string(),
});

export const ErrorSchema = z.object({
    error: z.string(),
});

export const BookSchema = z.object({
    id: z.string(),
    author_id: z.string(),
    title: z.string(),
    pub_year: z.string(),
    genre: z.string(),
});

export const BookArraySchema = z.object({
    books: z.array(BookSchema),
});

export const AuthorSchema = z.object({
    id: z.string(),
    name: z.string(),
    bio: z.string(),
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
