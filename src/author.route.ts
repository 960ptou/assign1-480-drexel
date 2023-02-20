import express, { Response, Request, NextFunction } from "express";
import { db } from "./init.js";
import {
    AuthorSchema,
    Author,
    AuthorRequestBody,
    AuthorArrayResponse,
    StringResponse,
} from "./types.js";
import { authorize } from "./crediential.route.js";

let router = express.Router();
router.use(express.json());

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

router.post("/author", authorize() ,async (req: AuthorRequestBody, res: StringResponse) => {
    try {
        AuthorSchema.parse(req.body);
    } catch (e) {
        return res.status(400).json({ error: "invalid author format" });
    }

    let authorExist = await db.get("select * from authors where id = ?", [req.body.id])
    if (authorExist){
        return res.json({message : "insertion failed : author exist"});
    }


    // Inserting 
    let insertStatement = await db.prepare(
        "insert into authors(id, name, bio) values (?,?,?)"
    );
    let insertRelation = await db.prepare(
        "insert into own_author(userid, author_id) values (?, ?)"
    )
    await insertStatement.bind([req.body.id, req.body.name, req.body.bio]);
    await insertRelation.bind([res.locals.userid, req.body.id])

    try {
        await insertStatement.run();
        await insertRelation.run();
        res.json({ message: "author inserted" });
    }catch (e){
        res.status(500).json({ error: "DB ERROR" });
    }

});


router.delete(
    "/author/:id",
    authorize(), authorExist(),
    async (req: Request, res: StringResponse) => {
        if (!res.locals.author) {
            return res.status(400).json({ error: "author don't exist" });
        }
        // Check for relation if owns book
        let isRelated = await db.get(
            "select * from own_author where userid = ? and author_id = ?", 
            [res.locals.userid, req.params.id]
        );

        if (!isRelated){
            return res.status(400).json({error : "You can't delete this author, Not owner"})
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


// NOTE : only for TESTING
if (process.env.NODE_ENV === "test"){
    // will delete all records in authors table.

    router.delete("/author", authorize() , async (req: Request, res: StringResponse) => {
        // THIS FAILS if ANY book exist in books table
        let allAuthors = await db.get("select * from authors");
        if (!allAuthors){
            return res.json({message : "No authors in DB already"});
        }
    
        let relatedBook = await db.get(
            "select * from books",
        );
    
        if (relatedBook){
            return res.status(400).json({error : "still books exist in DB, can't drop all authors"})
        }
    
        let statement = await db.prepare("delete from authors")
        try{
            statement.run();
            return res.json({message : "all authors deleted"})
        }catch(e){
            return res.status(500).json({ error: "Database error" });
        }
    })
}

export const authorRouter = router;