import { AuthorTable } from "./SpecificComponents/authorTable";
import { BookTable } from "./SpecificComponents/bookTable";
import { AddBookForm } from './SpecificComponents/addBookForm';
import { AddAuthorForm } from './SpecificComponents/addAuthorForm';
import { Routes, Route, Link } from "react-router-dom";
import { Button } from "@mui/material";

function App() {
    return (
        <>
            <nav>
                <ul>
                    <h2> Navigation : </h2>
                    <Button>
                        <Link to="/books"> Search to Modify | Delete Books </Link>
                    </Button>
                    <Button>
                        <Link to="/author"> Search to Modify | Delete Author </Link>
                    </Button>
                    <Button>
                        <Link to="/addbook"> Add Books</Link>
                    </Button>
                    <Button>
                        <Link to="/addauthor"> Add Authors</Link>
                    </Button>                    
                </ul>
            </nav>
            <Routes>
                <Route path="/books" element={
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
            </Routes>
        </>

    );
}
export default App;
