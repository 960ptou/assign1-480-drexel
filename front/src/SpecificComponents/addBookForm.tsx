import { PostForm } from "../Components/PostFrom/postFrom"

export function AddBookForm(){
    return (
        <PostForm
            url="/api/book"
            UiMsg="This is the form to upload books"
            eachInput={[
                {
                    id : "id",
                    size : "sm",
                    type : "number",
                    placeholder : "Please enter the book ID",
                    label : "Book ID"
                },
                {
                    id : "author_id",
                    size : "sm",
                    type : "number",
                    placeholder : "Please enter the author ID",
                    label : "Author ID"
                },
                {
                    id : "title",
                    size : "sm",
                    type : "text",
                    placeholder : "Please enter the book title",
                    label : "Title"
                },
                {
                    id : "pub_year",
                    size : "sm",
                    type : "number",
                    placeholder : "Please enter the book ID",
                    label : "Publication year (4digit)",
                    
                },
                {
                    id : "genre",
                    size : "sm",
                    type : "text",
                    placeholder : "Please enter the book genre",
                    label : "Book Genre",
                },
                
            ]}
        />
    )
}
