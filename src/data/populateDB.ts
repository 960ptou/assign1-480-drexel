import { db } from "../init.js";
import { faker } from '@faker-js/faker';
import { Book, Author} from '../types.js'



// This scritp WILL generate 500 books data and 100 author Data
const ID_DIGIT = 15
const GENRES = ['drama', 'fable', 'fairy tale', 
    'fantasy', 'fiction', 'fictionin verse', 
    'folklore', 'historical fiction', 'horror',
    'humor', 'legend', 'mystery', 'mythology', 
    'poetry', 'realistic fiction', 'science fiction', 
    'short story', 'tallTale', 'biography', 'essay', 
    'narrative nonfiction', 'nonfiction', 'speech'
]

function getRandomInt(min : number, max : number) : number {//mdn
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomId(digits : number) : string{
    return faker.random.numeric(digits);
}

// https://stackoverflow.com/questions/9071573/is-there-a-simple-way-to-make-a-random-selection-from-an-array-in-javascript-or
function choose(choices : any[]): any {// like python random.choice
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}


function getAuthorFake() : Author{
    const authorId : string = getRandomId(ID_DIGIT);
    const authorName : string = faker.name.fullName();
    const authorBio : string = faker.random.words(getRandomInt(50,100));
    return {
        id : authorId,
        name : authorName,
        bio : authorBio
    }
}

function getBookFake(authorIds : string[]) : Book{ // B/C book must be related to author
    const bkId : string = getRandomId(ID_DIGIT);
    const authorId : string = choose(authorIds);
    const bkTitle : string = faker.random.word();
    const bkYr : string = getRandomInt(1000, 9999).toString(); // From the future
    const bkGenre : string = choose(GENRES);
    return {
        id : bkId,
        author_id : authorId,
        title : bkTitle,
        pub_year : bkYr,
        genre : bkGenre
    }
}

async function addAuthor(id : string, name : string, bio : string) : Promise<void>{
    let insertStatement = await db.prepare(
        "insert into authors(id, name, bio) values (?,?,?)"
    );
    insertStatement.bind([id, name, bio]);

    try {
        await insertStatement.run();
    }catch (e){
        console.log(`error on Author : ${id}`, e)
    }
}

async function addBook(id : string, author_id : string, title : string, pub_year : string, genre : string): Promise<void>{
    let insertStatement = await db.prepare(
        "insert into books(id, author_id, title, pub_year, genre) values (?,?,?,?,?)"
    );
    insertStatement.bind([id, author_id, title, pub_year, genre]);

    try {
        await insertStatement.run();
    }catch (e){
        console.log(`error on Book : ${id}`, e)
    }
}

function generate(authors : number, books : number) : void{
    if (authors < 1){
        console.log("WTF is wrong with you, NO AUTHOR => NO BOOK")
        return
    }

    let authorIds : string[] = [];
    for(let i = 0; i < authors; i++){
        const a : Author = getAuthorFake();
        const [id, name, bio] = [a.id, a.name, a.bio];
        authorIds.push(id);
        addAuthor(id, name, bio);
    }

    for(let i = 0; i < books; i++){
        const b : Book = getBookFake(authorIds);
        const [id, author_id, title, pub_year, genre] = [b.id, b.author_id, b.title, b.pub_year, b.genre];
        addBook(id, author_id, title, pub_year, genre);
    }

    console.log(`COMPLETED ADDING ${authors} Authors, ${books} Books`); // IF no ERROR | Collision
}

generate(100, 500);