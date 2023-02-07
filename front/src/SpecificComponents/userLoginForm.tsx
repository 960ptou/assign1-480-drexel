import { CredientialForm } from "../Components/CredientialForm/credientialForm"

interface UserLoginFormProp{
    changeState : (state:boolean) => void
}

export function UserLoginForm(props : UserLoginFormProp){
    return (
        <CredientialForm url="crediential/login" redirectUrl="/books" submitText="Login" change={props.changeState}/>
    )
}