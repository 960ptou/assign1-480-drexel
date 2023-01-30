import express, { Response, Request, NextFunction } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
    AuthorSchema,
    Author,
    AuthorRequestBody,
    AuthorArrayResponse,
    StringResponse,
} from "./types.js";

let router = express.Router();
router.use(express.json());
let db = await open({
    filename: "../database.db",
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");

function authorExist(){ // Used in url like /author/:id
    return async (req: Request, res: Response, next: NextFunction) => {
        const authorId: string = req.params.id;
        try{
            let author: Author | undefined = await db.get(
                "select * from authors where id = ?",
                [authorId]
            );
            res.locals.author = author;
            next();
        }catch(e){
            return res.status(500).json({error : "Database Error"})
        }
    };
}

router.get("/author", async (req: Request, res: AuthorArrayResponse) => {
    let allAuthor: Author[] = await db.all("select * from authors");
    return res.json({ authors: allAuthor });
});

router.get(
    "/author/:id",
    authorExist(),
    async (req: Request, res: AuthorArrayResponse) => {
        if (!res.locals.author) {
            return res.status(400).json({ error: "author don't exist" });
        }
        return res.json({ authors: [res.locals.author] });
    }
);

router.post("/author", async (req: AuthorRequestBody, res: StringResponse) => {
    try {
        AuthorSchema.parse(req.body);
    } catch (e) {
        return res.status(403).json({ error: "invalid author format" });
    }

    let insertStatement = await db.prepare(
        "insert into authors(id, name, bio) values (?,?,?)"
    );
    await insertStatement.bind([req.body.id, req.body.name, req.body.bio]);
    try {
        await insertStatement.run();
        res.json({ message: "author inserted" });
    }catch (e){
        res.status(400).json({ error: "insertion failed : author exist" }); // Only error I can think of
    }
});

router.delete(
    "/author/:id",
    authorExist(),
    async (req: Request, res: StringResponse) => {
        if (!res.locals.author) {
            return res.status(400).json({ error: "author don't exist" });
        }
        // For this, you can't delete if there are still books under this author
        let relatedBook = await db.get(
            "select * from books where author_id = ?",
            [req.params.id]
        );

        if (relatedBook) {
            return res
                .status(400)
                .json({
                    error: "author can't be deleted because a book is related to this author",
                });
        }

        // Delete
        let statement = await db.prepare("delete from authors where id=?");
        await statement.bind([req.params.id]);
        try {
            await statement.run();
            return res.json({ message: "author deleted" });
        } catch (e) {
            return res.status(500).json({ error: "Database error" });
        }
    }
);

export const authorRouter = router;