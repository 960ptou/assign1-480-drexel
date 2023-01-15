import axios, { AxiosError } from "axios";

let port = 3000;
let host = "localhost";
let protocol = "http";
let baseUrl = `${protocol}://${host}:${port}`;

const authorUrl: string = `${baseUrl}/author`;
const bkUrl: string = `${baseUrl}/book`;

const idAuthor: string = "111";
const nameAuthor: string = "test1";
const bioAuthor: string = "my testing author";

const idBk: string = "111";
const titleB: string = "test Title";
const year: string = "2000";
const genreB: string = "fantasy";

// I'm assuming that DB is cleared


test("POST /author", async () => {
    let { data: data1 } = await axios.post(`${authorUrl}`, {
        id: idAuthor,
        name: nameAuthor,
        bio: bioAuthor,
    });
    expect(data1).toEqual({ message: "author inserted" });
});

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
        expect(response.data).toEqual({ error: "invalid insertion" });
    }
});

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
