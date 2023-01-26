import React, { useEffect, useState, useRef } from "react";

interface LabelInputProps {
    label: string;
    type: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}
function LabelInput(props: LabelInputProps) {
    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <label style={{width: '80px'}}> {props.label} </label>
            <input
                type={props.type}
                key={props.label} // not good idea but only way I have
                onChange={props.onChange}
            />
        </div>
    );
}
interface StrNumMap {
    [key: string]: string | number;
} // https://stackoverflow.com/questions/13315131/enforcing-the-type-of-the-indexed-members-of-a-typescript-object

interface PostFormProps {
    url: string;
    postBody: StrNumMap;
    UiMsg: string;
}

function PostForm(props: PostFormProps) {
    const [UiMsg, setUImsg] = useState(props.UiMsg);
    const [postBody, setPostBody] = useState(props.postBody);

    async function upload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const res = await fetch(props.url, {
                method: "POST",
                body: JSON.stringify(postBody),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json(); // somehow a message : string | error : string WONT work
            if (res.ok) {
                setUImsg(data.message);
            } else {
                setUImsg(data.error);
            }
            console.log(data); // REMOVE
        } catch (error: any) {
            // Only way it will compile
            console.log("Shouldn't be here");
        }
    }

    return (
        <form onSubmit={upload}>
            <div> {UiMsg} </div>
            {Object.entries(postBody).map(([key, val]) => {
                return (
                    <LabelInput
                        key={key}
                        type={typeof val === "string" ? "text" : "number"}
                        label={key}
                        onChange={(e) => {
                            setPostBody({ ...postBody, [key]: e.target.value });
                        }}
                    />
                );
            })}
            <input type="submit" value="Submit" />
        </form>
    );
}

interface DeleteRequestRowInter {
    displayList: string[];
    url: string;
    reloader: () => void;
}

function DeleteRequestRow(props: DeleteRequestRowInter) {
    async function sendDelete() {
        try {
            const res = await fetch(props.url, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                console.log("Success", data); // Debug
                props.reloader(); // tell parent to update
            } else {
                window.alert(data.error); // show error
                console.log("Failed"); // Debug
            }
        } catch (error: any) {
            console.log(error, "ERROR"); // REMOVE
        }
    }

    return (
        <tr>
            {props.displayList.map((info) => {
                return <td key={Math.random().toString()} style={{textAlign: "left"}}>{info}</td>;
            })}
            <td>
                <button onClick={sendDelete} style={{textAlign: "left"}}> X </button>
            </td>
        </tr>
    );
}

interface AuthorData {
    id: string;
    name: string;
    bio: string;
}

function AuthorTable() {
    const [UImsg, setUImsg] = useState(
        "Enter below to find author by id (empty for ALL authors)"
    );
    const [queryId, setQueryId] = useState("");
    const [queryResult, setQueryResult] = useState<AuthorData[]>([]);
    const [reload, setReload] = useState(0);
    const prevReload = useRef(reload); // gpt

    async function queryServer() {
        // Search author by id, if not provided will query for all
        try {
            const res = await fetch(`/api/author/${queryId}`);
            const data = await res.json(); // Not Needed
            console.log(data);
            if (!res.ok) {
                setUImsg(data.error);
                return;
            }
            setQueryResult(data.authors);
            setUImsg("Success!");
        } catch (e: any) {
            // Wont happen if used via UI
            console.log(e, "error");
        }
    }

    useEffect(() => {
        if (prevReload.current !== reload) {
            queryServer();
        }
    }, [reload]);

    return (
        <div>
            <div> {UImsg} </div>
            <input
                type="number"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQueryId(e.target.value)
                }
            />
            <br></br>
            <button onClick={queryServer}> Get Author </button>
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Name</th>
                        <th>Bio</th>
                        <th>Del</th>
                    </tr>
                </thead>
                <tbody>
                    {queryResult
                        .sort((a: AuthorData, b: AuthorData) => {
                            return a.name.localeCompare(b.name);
                        })
                        .map((data) => {
                            return (
                                <DeleteRequestRow
                                    key={data.id}
                                    displayList={[data.id, data.name, data.bio]}
                                    reloader={() => {
                                        setReload(reload + 1);
                                    }}
                                    url={`/api/author/${data.id}`}
                                />
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
}

interface BookData {
    id: string;
    author_id: string;
    title: string;
    pub_year: string;
    genre: string;
}
type BookSearchOptions = "id" | "author_id" | "title" | "pub_year" | "genre";
type MathOperOptions   = "eq" | "lt" | "gt"

function BookTable() {
    const [UImsg, setUImsg] = useState(
        "Below to find books accordingly (Empty for ALL books)"
    );
    const [queryValue, setQueryValue] = useState("");
    const [queryResult, setQueryResult] = useState<BookData[]>([]);
    const [searchOption, setSearchOption] = useState<BookSearchOptions>("id");
    const [reload, setReload] = useState(0);
    const prevReload = useRef(reload);

    const [yearSearch, setYearSearch] = useState<MathOperOptions>("eq");

    async function queryServer() {
        // Search author by id, if not provided will query for all
        try {
            let queryString: string;
            if (queryValue === "") {
                queryString = "";
            } else if (searchOption === "id") {
                queryString = queryValue;
            } else if (searchOption === "genre" || searchOption === "title"){
              queryString = `?query=${searchOption}='${queryValue}'`;
            }else if (searchOption === "author_id") {
                queryString = `?query=${searchOption}=${queryValue}`;
            } else {
                // must be pub_year
                let oper: string = {
                    eq: "=",
                    lt: "<",
                    gt: ">",
                }[yearSearch];
                queryString = `?query=${searchOption}${oper}${queryValue}`;
                console.log(queryString, "giao")
            }

            const res = await fetch(`/api/book/${queryString}`);
            const data = await res.json(); // Not Needed
            console.log(data);
            if (!res.ok) {
                setUImsg(data.error);
                return;
            }
            console.log(data.books);
            setQueryResult(data.books);
        } catch (e: any) {
            // Wont happen if used via UI
            console.log(e, "error");
        }
    }

    useEffect(() => {
        if (prevReload.current !== reload) {
            queryServer();
        }
    }, [reload]);

    return (
        <div>
            <div> {UImsg} </div>
            <input
                type={
                    searchOption === "title" || searchOption === "genre"
                        ? "text"
                        : "number"
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQueryValue(e.target.value)
                }
            />

            <select
                name="yearOption"
                style={{
                    visibility:
                        searchOption === "pub_year" ? "visible" : "hidden",
                }}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setYearSearch(e.target.value as MathOperOptions)
                }
            >
                <option value="eq"> {"="} </option>
                {/* <option value="gt"> {">"} </option> */} {/* DisABLED */}
                {/* <option value="lt"> {"<"} </option> */}
            </select>

            <select
                name="searchOption"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSearchOption(e.target.value as BookSearchOptions)
                }
            >
                <option value="id">Book Id</option>
                <option value="author_id">Author Id</option>
                <option value="title">Title</option>
                <option value="pub_year">Publication Year</option>
                <option value="genre"> Genre </option>
            </select>

            <br></br>
            <button onClick={queryServer}> Get Books </button>
            <table>
                <thead>
                    <tr>
                        <th>Book Id</th>
                        <th>Author Id</th>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Genre</th>
                        <th>Del</th>
                    </tr>
                </thead>
                <tbody>
                    {queryResult
                        .sort((a: BookData, b: BookData) => {
                            return a.title.localeCompare(b.title);
                        })
                        .map((data) => {
                            return (
                                <DeleteRequestRow
                                    key={data.id}
                                    displayList={[
                                        data.id,
                                        data.author_id,
                                        data.title,
                                        data.pub_year,
                                        data.genre,
                                    ]}
                                    reloader={() => {
                                        setReload(reload + 1);
                                    }}
                                    url={`/api/book/${data.id}`}
                                />
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
}

function App() {
    return (
        <div className="App" style={{paddingLeft : "50px"}}>
            <div style={{ border: "1px solid blue" }}>
                <h2> Block for Authors </h2>
                <h5> Adding Author </h5>
                <PostForm
                    url="/api/author"
                    postBody={{
                        id: 0,
                        name: "",
                        bio: "",
                    }}
                    UiMsg="This is the form to upload author"
                />
                <h5> Below to Search for Author using ID</h5>
                <AuthorTable />
            </div>

            <div style={{ border: "1px solid black" }}>
                <h2> Block for Books</h2>
                <h5> Adding Books </h5>
                <PostForm
                    url="/api/book"
                    postBody={{
                        id: 0,
                        author_id: 0,
                        title: "",
                        pub_year: 0,
                        genre: "",
                    }}
                    UiMsg="This is the form to upload books"
                />
                <h5> Below to Search for Book (drop down for more option) </h5>
                <BookTable />
            </div>
        </div>
    );
}

export default App;
