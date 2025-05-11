import {useParams} from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import classes from  "../hackathon.module.css"


const ChatSection = () => {
    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;


    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Чаты</PageLabel>

        </div>
    );
}


export default ChatSection