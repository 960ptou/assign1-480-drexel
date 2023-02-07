import express, {
    Request,
    Response,
    NextFunction,
    CookieOptions,
} from "express";
import * as argon2 from "argon2";
import crypto from "crypto";
import { db } from "./init.js";
import { LoginSchema, LoginRequestBody, StringResponse } from "./types.js";
import cookieParser from "cookie-parser";

let router = express.Router();
router.use(express.json());
router.use(cookieParser());

function makeToken() {
    // From activity
    return crypto.randomBytes(32).toString("hex");
}

let tokenStorage: { [key: string]: { username: string } } = {};

const cookieOptions: CookieOptions = {
    // httpOnly: true, // JS can't access it | NOW disabled for testing
    secure: true, // only sent over HTTPS connections
    sameSite: "strict", // only sent to this domain
};

router.post("/signup", async (req: LoginRequestBody, res: StringResponse)=>{
    let parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res
            .status(400)
            .json({ message: "Username or password invalid" });
    }

    const { username, password } = parseResult.data;
    let getUserRecord = await db.get(
        "select * from users where username = ?",
        [username]
    );

    if (getUserRecord){
        return res.status(400).json({error : "User already exist"})
    }

    try {
        const hashPass = await argon2.hash(password);
        let insertStatement = await db.prepare("insert into users(username, password) values (?, ?)");
        await insertStatement.bind([username, hashPass]);
        await insertStatement.run();
        // NO AUTO LOGIN! security (no one DDOS me!)
        return res.json({ message: "You've signup successfully" });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .json({ error: "Server Error" });
    }

})

router.post("/login", async (req: LoginRequestBody, res: StringResponse) => {
    let parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res
            .status(400)
            .json({ message: "Username or password invalid" });
    }

    const { username, password } = parseResult.data;
    let getUserPWHash = await db.get("select * from users where username = ?", [username]);

    if (!getUserPWHash) {
        return res.status(400).json({ message: "user doesn't exist" });
    }

    const hashPass = getUserPWHash.password;

    try {
        const verified = await argon2.verify(hashPass, password);
        if (!verified){
            return res
            .status(400)
            .json({ message: "Username or password incorrect" }); // Security!
        }

        const sesToken = makeToken();
        tokenStorage[sesToken] = { username: username };
        return res
            .cookie("token", sesToken, cookieOptions)
            .json({ message: "Logged In" });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .json({ error: "Server Error" });
    }
});

router.get("/loggedin", async (req: Request, res: Response) => {
    let { token } = req.cookies;
    if(tokenStorage.hasOwnProperty(token)){
        return res.send();
    }
    res.status(400).send();
})

// Not using for now
router.post("/logout", async (req: Request, res: StringResponse) => {
    let { token } = req.cookies;
    if (token === undefined) {
        return res.json({ message: "Already logged out" });
    }
    if (!tokenStorage.hasOwnProperty(token)) {
        return res.status(400).json({ error: "Token Invalid" });
    }
    delete tokenStorage[token];
    return res.clearCookie("token", cookieOptions).send();
});

// For TESTING ONLY | REMOVE when deploying
const testToken = makeToken();
router.post("/login/test", async (req: Request, res: StringResponse) => {
    tokenStorage[testToken] = { username: "test" };
    return res.json({ message: `token=${testToken}` });
});

router.post("/logout/test", async (req: Request, res: StringResponse) => {
    delete tokenStorage[testToken];
    return res.json({ message: "complete" });
});

export function authorize() {
    return (req: Request, res: Response, next: NextFunction) => {
        try{
            let { token } = req.cookies;
            if (!tokenStorage.hasOwnProperty(token)) {
                return res.status(400).json({ error: "Not logged in" });
            }
        }catch(e){
            return res.status(400).json({ error: "Not logged in" });
        }
        next();
    };
}


// NOTE : THIS IS ONLY used for testing, REMOVE after actual depolyment
router.delete("/users", authorize(),  async (req: Request, res: StringResponse) => {
    let statement = await db.prepare("delete from users");
    try {
        const result = await statement.run();
        return res.json({ message: "all users deleted" });
    } catch (e) {
        res.status(500).json({ error: "DB query error" });
    }
});

export const credientialRoute = router;
