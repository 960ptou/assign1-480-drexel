import { useState } from "react";
import Input from '@mui/joy/Input';
import { FormLabel,  FormControl} from "@mui/joy";
import { useNavigate} from 'react-router-dom';

interface CredientialFormProps {
    url: string;
    redirectUrl : string;
    submitText : string;
    change? : (state:boolean) => void;
}

export function CredientialForm(props : CredientialFormProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("Welcome!");
    const navigate = useNavigate();
    async function login(){
        const postLogin = {
            username : username,
            password : password,
        }

        try{
            const res = await fetch(props.url, {
                method: "POST",
                body: JSON.stringify(postLogin),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json(); // somehow a message : string | error : string WONT work
            if (res.ok) {
                // https://stackoverflow.com/questions/50644976/react-button-onclick-redirect-page
                navigate(props.redirectUrl)
                if (props.change){
                    props.change(true)
                }
            }
            setMsg(data.message || data.error)
        } catch(e){
            console.log("Shouldn't be here");
        }
    }


    return (
        <form onSubmit={(e)=>{e.preventDefault(); login()}}>
            <h4> {msg} </h4>
            <FormControl>
                <FormLabel>Username</FormLabel>
                <Input
                    key="username"
                    type="text"
                    placeholder="Username"
                    required
                    onChange={(e ) => {
                        setUsername(e.target.value);
                    }}/>
            </FormControl>

            <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                    key="password"
                    type="password"
                    placeholder="Password"
                    required
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}/>
            </FormControl>

            <Input type="submit" value={props.submitText} />
        </form>
    );
}