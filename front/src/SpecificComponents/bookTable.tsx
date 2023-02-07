import { PutDeleteTable } from "../Components/PutDeleteTable/PutDeleteTable";
import React, { useEffect, useState, useRef } from "react";
import { Input, Button } from '@mui/material';

interface BookData {
    id: string;
    author_id: string;
    title: string;
    pub_year: string;
    genre: string;
}
type BookSearchOptions = "id" | "author_id" | "title" | "pub_year" | "genre";
type MathOperOptions   = "eq" | "lt" | "gt"

interface BookTableProps{
    logged : boolean
} 

export function BookTable(props : BookTableProps) {
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
            }

            const res = await fetch(`/api/book/${queryString}`);
            const data = await res.json(); // Not Needed

            if (!res.ok) {
                setUImsg(data.error);
                return;
            }
            setQueryResult(data.books);
        } catch (e: any) {
            // Wont happen if used via UI
            console.log("error");
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
            <Input
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
            <Button onClick={queryServer}> Get Books </Button>
            <PutDeleteTable 
                columns = {[
                    {
                        field : "id",
                        headerName : "Book Id",
                        type : "number",
                        minWidth : 200,
                        editable : false,
                    },
                    {
                        field : "author_id",
                        headerName : "Author Id",
                        type : "number",
                        minWidth : 200,
                        editable : false,
                    },
                    {
                        field : "title",
                        headerName : "Title",
                        minWidth : 200,
                        editable : props.logged,
                    },
                    {
                        field : "pub_year",
                        headerName : "Publication Year",
                        minWidth : 200,
                        editable : props.logged,
                    },
                    {
                        field : "genre",
                        headerName : "Genre",
                        minWidth : 200,
                        editable : props.logged,
                    }
                ]}
                rows = {queryResult}
                baseUrl={`/api/book`}
                reload={()=>{setReload(reload + 1)}}
                enableDelete={props.logged}
            />
        </div>
    );
}