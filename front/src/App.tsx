import { AuthorTable } from "./SpecificComponents/authorTable";
import { BookTable } from "./SpecificComponents/bookTable";
import { AddBookForm } from './SpecificComponents/addBookForm';
import { AddAuthorForm } from './SpecificComponents/addAuthorForm';
import { Routes, Route, Link } from "react-router-dom";
import { Button } from "@mui/material";

import { UserLoginForm } from "./SpecificComponents/userLoginForm";
import { useState,  ReactElement } from "react";
import { UserSignupForm } from "./SpecificComponents/userSignupForm";


function App() {
    const [login, setLogin] = useState(false);

    async function isLogged(){
        let res = await fetch("/crediential/loggedin")
        setLogin(res.ok);
    }
    isLogged();


    const elementNavigation : { [url : string] : {
        msg : string,
        elementComp : ReactElement,
    }} = {
        "/books" : {msg : "Search to Modify | Delete Books", elementComp : <BookTable logged={login}/>},
        "/author" : {msg : "Search to Modify | Delete Author", elementComp : <AuthorTable logged={login}/>},
        "/addbook" : {msg : "Add Books", elementComp : <AddBookForm/>},
        "/addauthor" : {msg : "Add Authors", elementComp : <AddAuthorForm/>},
        "/login" : {msg : "Login", elementComp : <UserLoginForm changeState={(state:boolean) => {setLogin(state)}}/>},
        "/signup" : {msg : "Sign Up", elementComp : <UserSignupForm/>},
    };



    return (
        <>
            <nav>
                <ul>
                    <h2> Navigation : </h2>
                    {
                        Object.keys(elementNavigation).map(url =>{
                            if (!login && ["/addbook", "/addauthor"].includes(url)){
                                return <></>
                            }

                            if (login && ["/login"].includes(url)){
                                return <></>
                            }


                            return <Button key={url}>
                                <Link to={url}> {elementNavigation[url].msg} </Link>
                            </Button>
                        })
                    }
                    {
                        login? <Button key="logout" onClick={async ()=>{
                            if (!window.confirm("Do you want to log out?")){
                                return
                            }
                            const res = await fetch("crediential/logout", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            });
                            if (res.ok){
                                setLogin(false)
                            }
                        }}>
                            Log Out
                        </Button> : <></>
                    }
                    
                </ul>
            </nav>
            <Routes>
                {
                    Object.keys(elementNavigation).map(url =>{
                        if (!login && ["/addbook", "/addauthor"].includes(url)){
                            return <></>
                        }

                        return <Route path={url} key={url} element={
                            <>
                                <h1> {elementNavigation[url].msg} </h1>
                                {elementNavigation[url].elementComp}
                            </>
                        }/>
                    })
                }

                {/* <Route path="/books" element={
                <>
                    <h1> Search to Modify | Delete Books</h1>
                    <BookTable />
                </>}/>
                <Route path="/author" element={
                    <>
                        <h1> Search to Modify | Delete Authors</h1>
                        <AuthorTable />
                    </>
                }/>
                <Route path="/addbook" element={
                    <>
                        <h1> Add books</h1>
                        <AddBookForm/>
                    </>
                }/>
                    
                <Route path="/addauthor" element={
                    <>
                        <h1> Add Authors </h1>
                        <AddAuthorForm/>
                    </>
                }/>

                <Route path="/login" element={
                    <>
                        <h1> Login </h1>
                        <UserLoginForm/>
                    </>
                }/>

                <Route path="/signup" element={
                    <>
                        <h1> Sign Up </h1>
                        <UserSignupForm/>
                    </>
                }/> */}


            </Routes>
        </>

    );
}
export default App;
