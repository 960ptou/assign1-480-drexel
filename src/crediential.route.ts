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

let tokenStorage: { [key: string]: { username: string, userid:string } } = {};

const cookieOptions: CookieOptions = {
    httpOnly: true, // JS can't access it
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

// I will only ban login from being accessed instead of just the whole IP
let badIP : { [ip : string] :  number } = {}
let badLoginUser : { [account : string] :  number } = {}
let failedLoginIP : { [ip : string] :  number } = {}
let failedLoginUser : { [account : string] : number } = {}


// This function will check either to ban or not, if ban it will ban it
function banning(userKey : string, record : { [key : string] : number}, limit : number): boolean{
    if (record[userKey] >= limit){
        return true
    }
    return false
}
// This function will decide whether to release from banning, if yes, will release it. | performs at next login request
function release(userKey : string, banList :{ [key : string]  : number}):boolean{
    if (banList[userKey] > (Date.now()/1000)){
        delete banList[userKey]
        return true
    }
    return false
}

setInterval(()=>{
    failedLoginIP = {}
    failedLoginUser = {}
    badIP = {}
    badLoginUser = {}
}, 1000*60*30) // Every 30 minutes, perform a check to clear out

router.post("/login", async (req: LoginRequestBody, res: StringResponse) => {
    const userIP = req.ip;

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
    const userID = getUserPWHash.id;
    // BLOCKING

    if (badIP.hasOwnProperty(userIP)){
        if(!release(userIP, badIP)){
            return res.status(403).json({message : "You are banned, try later"})
        }
    }
    if (badLoginUser.hasOwnProperty(userID)){
        if(!release(userID, badLoginUser)){
            return res.status(403).json({message : "You are banned, try later"})
        }
    }

    try {
        const verified = await argon2.verify(hashPass, password);
        if (!verified){
            if (failedLoginIP.hasOwnProperty(userIP)){
                failedLoginIP[userIP] ++
            }else{
                failedLoginIP[userIP] = 1
            }
            if (failedLoginUser.hasOwnProperty(userID)){
                failedLoginUser[userID] ++
            }else{
                failedLoginUser[userID] = 1
            }

            // I... Just don't understand why I need that 1000
            if (banning(userIP, failedLoginIP, 5)){
                badIP[userIP] = 1 ; //(Date.now() + (1000 * 60 * 10));
            }
            if (banning(userID, failedLoginUser, 5)){
                badLoginUser[userID] = 1;
            }

            return res
            .status(403)
            .json({ message: "Username or password incorrect" }); // Security!
        }

        const sesToken = makeToken();
        tokenStorage[sesToken] = { username: username, userid : userID };
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

// For TESTING ONLY
if (process.env.NODE_ENV === "test"){
    const testToken = makeToken();
    router.post("/signup/test", async (req: Request, res: StringResponse) =>{
        let insertStatement = await db.prepare("insert into users(id, username, password) values (?, ?, ?)");
        await insertStatement.bind(["9999999999", "test", "test"]);
        await insertStatement.run();
        
        return res.json({message : "complete"})
    })

    router.post("/login/test", async (req: Request, res: StringResponse) => {
        tokenStorage[testToken] = { username: "test" , userid:"9999999999"};
        return res.json({ message: `token=${testToken}` });
    });

    router.post("/logout/test", async (req: Request, res: StringResponse) => {
        delete tokenStorage[testToken];
        return res.json({ message: "complete" });
    });

    // CSRF
    router.get("/life", authorize(), async (req: Request, res: StringResponse) => {
        console.log("CSRF");
        res.json({message : "errere"});
    })

    router.delete("/users", authorize(),  async (req: Request, res: StringResponse) => {
        let statement = await db.prepare("delete from users");
        try {
            const result = await statement.run();
            return res.json({ message: "all users deleted" });
        } catch (e) {
            res.status(500).json({ error: "DB query error" });
        }
    });
}


export function authorize() {
    return (req: Request, res: Response, next: NextFunction) => {
        try{
            let { token } = req.cookies;
            if (!tokenStorage.hasOwnProperty(token)) {
                return res.status(400).json({ error: "Not logged in" });
            }else{
                res.locals.userid = tokenStorage[token].userid;
            }
        }catch(e){
            return res.status(400).json({ error: "Not logged in" });
        }
        
        next();
    };
}




export const credientialRoute = router;
