import express, { Request } from "express";
import { db } from "./init.js";
import {
    BookSchema,
    Book,
    BookRequestBody,
    BookArrayResponse,
    StringResponse,
} from "./types.js";
import { authorize } from "./crediential.route.js";

let router = express.Router();
router.use(express.json());


// Get /book:id
router.get("/book/:id", async (req: Request, res: BookArrayResponse) => {
    try {
        const bks = await db.get(
            "select * from books where id=?",
            [req.params.id]
        );
        if (bks === undefined){
            return res.status(400).json({error : "No book found with related Id"});
        }

        return res.json({books: [bks]});
    } catch (e) {
        return res.status(500).json({error : "DB query error"});
    }
})

// GET /book | /book?query
router.get("/book/:id?", async (req: Request, res: BookArrayResponse) => {

    let hasQuery: boolean = Object.keys(req.query).length > 0;
    let queryString: string = "select * from books";

    if (hasQuery) {
        queryString = `${queryString} where ${req.query["query"]}`.split(
            ";"
        )[0]; // avoid sql injection by removing all things append ';'
    }

    try {
        let bks: Book[] = await db.all(queryString);
        return res.json({ books: bks });
    } catch (e) {
        return res.status(500).json({ error: "DB query error" });
    }
});


// POST
router.post("/book", authorize(), async (req: BookRequestBody, res: StringResponse) => {
    try {
        BookSchema.parse(req.body);
    } catch (e) {
        return res.status(400).json({ error: "book format invalid" });
    }

    const authorId: string = req.body.author_id;
    const bkid: string = req.body.id;

    // forbid insert without author existing
    let author = await db.get("select * from authors where id = ?", [authorId]);
    if (!author) {
        return res.status(400).json({ error: "author don't exist" });
    }

    // remove same id issue
    let bookWithSameId = await db.get("select * from books where id = ?", [bkid]);
    if (bookWithSameId){
        return res.status(400).json({ error: "insertion failed : book id exist"})
    }

    // inserting
    let insertStatement = await db.prepare(
        "insert into books(id, author_id, title, pub_year, genre) values (?,?,?,?,?)"
    );
    let insertRelation = await db.prepare(
        "insert into own_book(userid, bid) values (?, ?)"
    )
    await insertStatement.bind([
        bkid,
        authorId,
        req.body.title,
        req.body.pub_year,
        req.body.genre,
    ]);
    await insertRelation.bind([res.locals.userid, bkid])

    try {
        await insertStatement.run();
        await insertRelation.run();
        res.json({ message: "inserted" });
    } catch (e) {
        res.status(500).json({ error: "DB query error" });
    }
});

// PUT -> Forcing ALL field https://www.mscharhag.com/api-design/updating-resources-put
// But it forces to do simular things like the delete button
router.put("/book", authorize(), async (req: BookRequestBody, res: StringResponse) => {
    try {
        BookSchema.parse(req.body);
    } catch (e) {
        return res.status(400).json({ error: "book format invalid" });
    }

    const authorId: string = req.body.author_id;

    // forbid CHANGING if new author doesn't exist
    let author = await db.get("select * from authors where id = ?", [authorId]);
    if (!author) {
        return res.status(400).json({ error: "author don't exist" });
    }

    // check is own by user
    let isRelated = await db.get(
        "select * from own_book where userid = ? and bid = ?", 
        [res.locals.userid, req.body.id]
    );

    if (!isRelated){
        return res.status(400).json({error : "You can't change this book, Not owner"})
    }

    // inserting
    let updateStatement = await db.prepare(
        "update books set author_id = ?, title = ?, pub_year = ?, genre = ? where id = ?"
    );
    await updateStatement.bind([
        authorId,
        req.body.title,
        req.body.pub_year,
        req.body.genre,
        req.body.id,
    ]);

    try {
        await updateStatement.run();
        return res.json({ message: "updated" });
    } catch (e) {
        return res.status(500).json({ error: "DB query error" });
    }
});


// DELETE
router.delete("/book/:id", authorize(), async (req: Request, res: StringResponse) => {
    const bkid: string = req.params.id;

    // In case book don't exist
    let bookWithSameId = await db.get("select * from books where id = ?", [bkid]);
    if (!bookWithSameId){
        return res.status(400).json({ error: "insertion failed : book doesn't exist"})
    }
    // Check ownership
    let isRelated = await db.get(
        "select * from own_book where userid = ? and bid = ?", 
        [res.locals.userid, req.params.id]
    );

    if (!isRelated){
        return res.status(400).json({error : "You can't delete this book, Not owner"})
    }

    // Deleting
    let statement = await db.prepare("delete from books where id=?");
    await statement.bind([bkid]);
    try {
        const result = await statement.run();
        if (result.changes === 0) {
            return res.status(400).json({ message: "book wasn't delete" });
        }
        return res.json({ message: "success book deleted" });
    } catch (e) {
        res.status(500).json({ error: "DB query error" });
    }
});


// NOTE : THIS IS ONLY used for testing
if (process.env.NODE_ENV === "test"){
    //REMOVE after actual depolyment
    router.delete("/book", authorize(),  async (req: Request, res: StringResponse) => {
        let allBooks = await db.get("select * from books");
        if (!allBooks){
            return res.json({message : "No Books in DB already"});
        }
    
        let statement = await db.prepare("delete from books");
        try {
            const result = await statement.run();
            return res.json({ message: "all books deleted" });
        } catch (e) {
            res.status(500).json({ error: "DB query error" });
        }
    });
}



export const bookRouter = router;