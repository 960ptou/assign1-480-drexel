import { PostForm } from "../Components/PostFrom/postFrom"

export function AddAuthorForm(){
    return (
        <PostForm
            url="/api/author"
            UiMsg="This is the form to upload author"
            eachInput={[
                {
                    id : "id",
                    size : "sm",
                    type : "number",
                    placeholder : "Please enter the author ID",
                    label : "Author ID"
                },
                {
                    id:"name",
                    size : "sm",
                    type : "text",
                    placeholder : "Please enter the author name",
                    label : "Author Name"
                },
                {
                    id:"bio",
                    size : "sm",
                    type : "text",
                    placeholder : "Please enter the author bio",
                    label : "Author Bio"
                }
            ]}
        />
    )
}