import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { faker } from '@faker-js/faker';
import * as argon2 from "argon2";


export let db = await open({
    filename: "../database.db",
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");

// This scritp WILL generate 500 books data and 100 author Data
const ID_DIGIT = 15;
const GENRES = ['drama', 'fable', 'fairy tale',
    'fantasy', 'fiction', 'fictionin verse',
    'folklore', 'historical fiction', 'horror',
    'humor', 'legend', 'mystery', 'mythology',
    'poetry', 'realistic fiction', 'science fiction',
    'short story', 'tallTale', 'biography', 'essay',
    'narrative nonfiction', 'nonfiction', 'speech'
];
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
function getRandomId(digits) {
    return faker.random.numeric(digits);
}
// https://stackoverflow.com/questions/9071573/is-there-a-simple-way-to-make-a-random-selection-from-an-array-in-javascript-or
function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}
function getAuthorFake() {
    const authorId = getRandomId(ID_DIGIT);
    const authorName = faker.name.fullName();
    const authorBio = faker.random.words(getRandomInt(50, 100));
    return {
        id: authorId,
        name: authorName,
        bio: authorBio
    };
}
function getBookFake(authorIds) {
    const bkId = getRandomId(ID_DIGIT);
    const authorId = choose(authorIds);
    const bkTitle = faker.random.word();
    const bkYr = getRandomInt(1000, 9999).toString(); // From the future
    const bkGenre = choose(GENRES);
    return {
        id: bkId,
        author_id: authorId,
        title: bkTitle,
        pub_year: bkYr,
        genre: bkGenre
    };
}
async function addAuthor(id, name, bio) {
    let insertStatement = await db.prepare("insert into authors(id, name, bio) values (?,?,?)");
    await insertStatement.bind([id, name, bio]);
    try {
        await insertStatement.run();
    }
    catch (e) {
        console.log(`error on Author : ${id}`, e);
    }
}
async function addBook(id, author_id, title, pub_year, genre) {
    let insertStatement = await db.prepare("insert into books(id, author_id, title, pub_year, genre) values (?,?,?,?,?)");
    await insertStatement.bind([id, author_id, title, pub_year, genre]);
    try {
        await insertStatement.run();
    }
    catch (e) {
        console.log(`error on Book : ${id}`, e);
    }
}

async function addOwnBook(bid, userid){
    let insertStatement = await db.prepare("insert into own_book(userid, bid) values (?,?)");
    await insertStatement.bind([userid, bid]);
    try {
        await insertStatement.run();
    }
    catch (e) {
        console.log(`error on own book : ${bid}`, e);
    }
}

async function addOwnAuthor(author_id, userid){
    let insertStatement = await db.prepare("insert into own_author(userid, author_id) values (?,?)");
    await insertStatement.bind([userid, author_id]);
    try {
        await insertStatement.run();
    }
    catch (e) {
        console.log(`error on own author : ${author_id}`, e);
    }
}

async function addUser(username, pass, id){
    const hashPass = await argon2.hash(pass);
    let insertStatement = await db.prepare("insert into users(id, username, password) values (?, ?,?)");
    await insertStatement.bind([id, username, hashPass]);
    try {
        await insertStatement.run();
    }
    catch (e) {
        console.log(`error on own add user : ${id}`, e);
    }
}

async function generate(authors, books) {
    if (authors < 1) {
        console.log("WTF is wrong with you, NO AUTHOR => NO BOOK");
        return;
    }
    const userIDs = [1,2,3,4];
    const usernames = ["admin", "applesauce", "bananabread", "coconutcake"];
    const userPass = ["password", "abc", "fiddlesticks", "correcthorsebatterystaple"];

    for (let i = 0; i < userIDs.length; i++){
        await addUser(usernames[i], userPass[i], userIDs[i]);
    }

    let authorIds = [];
    for (let i = 0; i < authors; i++) {
        const a = getAuthorFake();
        const [id, name, bio] = [a.id, a.name, a.bio];
        authorIds.push(id);
        await addAuthor(id, name, bio);
        await addOwnAuthor(id, choose(userIDs));
    }

    for (let i = 0; i < books; i++) {
        const b = getBookFake(authorIds);
        const [id, author_id, title, pub_year, genre] = [b.id, b.author_id, b.title, b.pub_year, b.genre];
        await addBook(id, author_id, title, pub_year, genre);
        await addOwnBook(id, choose(userIDs)); // Design don't require same book owner for same author owner
    }

    console.log(`COMPLETED ADDING ${authors} Authors, ${books} Books`); // IF no ERROR | Collision
}
generate(100, 500);
