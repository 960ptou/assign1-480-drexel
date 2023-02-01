import { PutDeleteTable } from "../Components/PutDeleteTable/PutDeleteTable";
import React, { useEffect, useState, useRef } from "react";
import { Input, FormControl , FormLabel } from "@mui/material";

interface AuthorData {
    id: string;
    name: string;
    bio: string;
}

export function AuthorTable() {
    const [UImsg, setUImsg] = useState(
        "Enter below to find author by id (empty for ALL authors)"
    );
    const [queryId, setQueryId] = useState("");
    const [queryResult, setQueryResult] = useState<AuthorData[]>([]);
    const [reload, setReload] = useState(0);
    const prevReload = useRef(reload); // GPT -> avoid useEffect initial calls

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
            setUImsg("Enter below to find author by id (empty for ALL authors)");
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
            <form onSubmit={(e) => {
                e.preventDefault();
                queryServer()
                }}>
                <FormControl>
                    <FormLabel>{UImsg}</FormLabel>
                    <Input
                        type="number"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setQueryId(e.target.value)
                        }
                    />
                    <Input type="submit" value="Get Author" />
                </FormControl>
            </form>
      
            {/* <br></br> */}
            {/* <button onClick={queryServer}> Get Author </button> */}

            <PutDeleteTable 
                columns = {[
                    {
                        field : "id",
                        headerName : "Author Id",
                        type : "number",
                        minWidth : 200,
                        editable : false,
                    },
                    {
                        field : "name",
                        headerName : "Author Name",
                        minWidth : 200,
                        editable : false,
                    },
                    {
                        field : "bio",
                        headerName : "Author Bio",
                        minWidth : 200,
                        editable : false,
                    }
                ]}
                rows = {queryResult}
                baseUrl={`/api/author`}
                reload={()=>{setReload(reload + 1)}}
            />
        </div>
    );
}