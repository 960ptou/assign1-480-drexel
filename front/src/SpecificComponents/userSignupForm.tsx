import { CredientialForm } from "../Components/CredientialForm/credientialForm"

export function UserSignupForm(){
    return (
        <CredientialForm url="crediential/signup" redirectUrl="/login" submitText="Signup"/>
    )
}