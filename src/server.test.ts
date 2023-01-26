import axios, { AxiosError } from "axios";

let port = 4000;
let host = "localhost";
let protocol = "http";
let baseUrl = `${protocol}://${host}:${port}/api`;

const authorUrl: string = `${baseUrl}/author`;
const bkUrl: string = `${baseUrl}/book`;

const idAuthor: string = "111";
const nameAuthor: string = "test1";
const bioAuthor: string = "my testing author";

const idBk: string = "111";
const titleB: string = "test-Title";
const year: string = "2000";
const genreB: string = "fantasy";


// NOTE : IF DATABASE IS NOT CLEARED | SOME TESTS WILL FAIL!
beforeAll(async () => {
    try {
        await axios.delete(`${bkUrl}/${idBk}`);
    } catch (e) {
        console.log("TEST Book did not exist");
    }
    try {
        await axios.delete(`${authorUrl}/${idAuthor}`);
    } catch (e) {
        console.log("TEST Author did not exist");
    }
});

// Add author
test("POST /author", async () => {
    let { data: data1 } = await axios.post(`${authorUrl}`, {
        id: idAuthor,
        name: nameAuthor,
        bio: bioAuthor,
    });
    expect(data1).toEqual({ message: "author inserted" });
});

// Add same author
test("POST /author same", async () => {
    try {
        await axios.post(`${authorUrl}`, {
            id: idAuthor,
            name: nameAuthor,
            bio: bioAuthor,
        });
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(400);
        expect(response.data).toEqual({ error: "insertion failed : author exist" });
    }
});

// Add author with invalid format
test("POST /author invalid", async () => {
    try {
        await axios.post(`${authorUrl}`, {
            id: idAuthor,
            name: nameAuthor,
        });
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(403);
        expect(response.data).toEqual({ error: "invalid author format" });
    }
});

// Get Author on default id
test("GET /author/" + idAuthor, async () => {
    // only record
    let { data: data1 } = await axios.get(`${authorUrl}/${idAuthor}`);
    expect(data1).toEqual({
        authors: [
            {
                id: idAuthor,
                name: nameAuthor,
                bio: bioAuthor,
            },
        ],
    });
});

// Get all authors | FAILS when DB NOT CLEAR
test("GET /author", async () => {
    // only record
    let { data: data1 } = await axios.get(`${authorUrl}/${idAuthor}`);
    expect(data1).toEqual({
        authors: [
            {
                id: idAuthor,
                name: nameAuthor,
                bio: bioAuthor,
            },
        ],
    });
});

// remove author after adding
test("DELETE /author/ id", async () => {
    let test = {
        id: "11111",
        name: "tc",
        bio: "biology",
    };

    await axios.post(`${authorUrl}`, test);
    let { data: data1 } = await axios.delete(`${authorUrl}/${test.id}`);
    expect(data1).toEqual({ message: "author deleted" });
});

// remove non-existing author
test("DELETE /author/ not real id", async () => {
    try {
        await axios.delete(`${authorUrl}/999999`);
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(400);
        expect(response.data).toEqual({ error: "author don't exist" });
    }
});

// books

// Add a book under above author
test("POST /book", async () => {
    let { data: data1 } = await axios.post(bkUrl, {
        id: idBk,
        author_id: idAuthor,
        title: titleB,
        pub_year: year,
        genre: genreB,
    });
    expect(data1).toEqual({ message: "inserted" });
});

test("POST book with non-existing author id",async () => {
    try {
        await axios.post(`${bkUrl}`, {
            id: "999000",
            author_id: "999000",
            title: "t1",
            pub_year: "1222",
            genre: "fictional",
        })
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(403);
        expect(response.data).toEqual({ error: "author don't exist" });
    }
})


// get added book
test("GET /book/id", async () => {
    let { data: data1 } = await axios.get(`${bkUrl}/${idBk}`);
    expect(data1).toEqual({
        books: [
            {
                id: idBk,
                author_id: idAuthor,
                title: titleB,
                pub_year: year,
                genre: genreB,
            },
        ],
    });
});

// get all books
test("GET /book", async () => {
    let { data: data1 } = await axios.get(`${bkUrl}`);
    expect(data1).toEqual({
        books: [
            {
                id: idBk,
                author_id: idAuthor,
                title: titleB,
                pub_year: year,
                genre: genreB,
            },
        ],
    });
});

// Get book on query | NOTE THIS THING FAILS WHEN DB IS NOT CLEARED!
// test("GET /book?query=...", async () => {
//     const q1 = `${bkUrl}?query=genre='${genreB}'`;
//     const q2 = `${bkUrl}?query=pub_year>${(year as unknown as number) - 1}`;
//     const q3 = `${bkUrl}?query=pub_year>${(year as unknown as number) + 1}`;
//     const q4 = `${bkUrl}?query=title='${titleB}'`;
//     const q5 = `${bkUrl}?query=author_id='${idAuthor}'`;

//     let { data: data1 } = await axios.get(q1);
//     let { data: data2 } = await axios.get(q2);
//     let { data: data3 } = await axios.get(q3);
//     let { data: data4 } = await axios.get(q4);
//     let { data: data5 } = await axios.get(q5);


//     expect(data1).toEqual({
//         books: [
//             {
//                 id: idBk,
//                 author_id: idAuthor,
//                 title: titleB,
//                 pub_year: year,
//                 genre: genreB,
//             },
//         ],
//     });

//     expect(data2).toEqual({
//         books: [
//             {
//                 id: idBk,
//                 author_id: idAuthor,
//                 title: titleB,
//                 pub_year: year,
//                 genre: genreB,
//             },
//         ],
//     });

//     expect(data3).toEqual({
//         books: [],
//     });

//     expect(data4).toEqual({
//         books: [
//             {
//                 id: idBk,
//                 author_id: idAuthor,
//                 title: titleB,
//                 pub_year: year,
//                 genre: genreB,
//             },
//         ],
//     });
//     expect(data5).toEqual({
//         books: [
//             {
//                 id: idBk,
//                 author_id: idAuthor,
//                 title: titleB,
//                 pub_year: year,
//                 genre: genreB,
//             },
//         ],
//     });
// });

// GET on invalid query
test("GET /book?query=...", async () => {
    const q1 = `${bkUrl}?query=genre='space not allowed'`;
    const q2 = `${bkUrl}?query=notexisting='1'`;

    try {
        await axios.get(q1);
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(400);
        expect(response.data).toEqual({ error: "query error" });
    }

    try {
        await axios.get(q2);
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(400);
        expect(response.data).toEqual({ error: "query error" });
    }

});


// delete added book
test("DELETE /book id", async () => {
    let test = {
        id: "5555",
        author_id: idAuthor,
        title: "title",
        pub_year: "1232",
        genre: "fiction",
    };
    await axios.post(bkUrl, test);
    let { data: data1 } = await axios.delete(`${bkUrl}/${test.id}`);
    expect(data1).toEqual({ message: "success book deleted" });
});

// delete non existing book
test("DELETE /book not existing", async () => {
    try {
        await axios.delete(`${bkUrl}/9999999`);
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(400);
        expect(response.data).toEqual({ message: "nothing was deleted" });
    }
});


test("DETELE author with related book", async()=>{
    try {
        await axios.delete(`${authorUrl}/${idAuthor}`);
    } catch (e) {
        let errorObj = e as AxiosError;
        if (errorObj.response === undefined) {
            throw errorObj;
        }
        let { response } = errorObj;
        expect(response.status).toEqual(400);
        expect(response.data).toEqual({error: "author can't be deleted because a book is related to this author"});
    }
})
