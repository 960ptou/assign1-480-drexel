import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { faker } from '@faker-js/faker';

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
    insertStatement.bind([id, name, bio]);
    try {
        await insertStatement.run();
    }
    catch (e) {
        console.log(`error on Author : ${id}`, e);
    }
}
async function addBook(id, author_id, title, pub_year, genre) {
    let insertStatement = await db.prepare("insert into books(id, author_id, title, pub_year, genre) values (?,?,?,?,?)");
    insertStatement.bind([id, author_id, title, pub_year, genre]);
    try {
        await insertStatement.run();
    }
    catch (e) {
        console.log(`error on Book : ${id}`, e);
    }
}
function generate(authors, books) {
    if (authors < 1) {
        console.log("WTF is wrong with you, NO AUTHOR => NO BOOK");
        return;
    }
    let authorIds = [];
    for (let i = 0; i < authors; i++) {
        const a = getAuthorFake();
        const [id, name, bio] = [a.id, a.name, a.bio];
        authorIds.push(id);
        addAuthor(id, name, bio);
    }
    for (let i = 0; i < books; i++) {
        const b = getBookFake(authorIds);
        const [id, author_id, title, pub_year, genre] = [b.id, b.author_id, b.title, b.pub_year, b.genre];
        addBook(id, author_id, title, pub_year, genre);
    }
    console.log(`COMPLETED ADDING ${authors} Authors, ${books} Books`); // IF no ERROR | Collision
}
generate(100, 500);
