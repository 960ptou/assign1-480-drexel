import React, { useState, useMemo } from "react";
import Input from '@mui/joy/Input';
import { FormLabel,  FormControl} from "@mui/joy";


interface PostFormProps {
    url: string;
    UiMsg: string;
    eachInput : InputRequirement[];
}

interface InputRequirement{
    id : string;
    type : "text" | "number";
    size : "sm" | "md" | "lg";
    placeholder : string;
    label : string;
}

interface StrNumMap {
    [key: string]: string | number;
}


export function PostForm(props: PostFormProps) {
    const [UiMsg, setUImsg] = useState(props.UiMsg);

    let body : StrNumMap = {};
    props.eachInput.forEach(element => {
        body[element.id] = ""
    });

    const [postBody, setPostBody] = useState(body);

    async function upload(event: React.FormEvent<HTMLFormElement>) {
        console.log(postBody)
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

    const memoInputs = useMemo(() => { 
        return props.eachInput.map((obj) => {
            let inputObj = undefined;
            if (obj.type === "number"){
                inputObj = <Input
                        type={obj.type}
                        required
                        size={obj.size}
                        onChange={(e) => {
                            setPostBody({ ...postBody, [obj.id]: e.target.value });
                        }}
                    />
            }else{
                inputObj = <Input 
                        type={obj.type}
                        placeholder={obj.placeholder}
                        required
                        size={obj.size}
                        onChange={(e ) => {
                            setPostBody({ ...postBody, [obj.id]: e.target.value });
                        }}
                    />
            }

            return (
                <FormControl key={obj.id}>
                    <FormLabel>{obj.label}</FormLabel>
                    {inputObj}
                </FormControl>
            );
        });
    }, [postBody]);

    return (
        <form onSubmit={upload}>
            <div> {UiMsg} </div>
            {memoInputs}
            <Input type="submit" value="Submit" />
        </form>
    );
}